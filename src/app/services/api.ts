import { fetch } from '@inrupt/solid-client-authn-browser'
import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react'
import { LdoFactory } from 'ldo'
import { FoafProfileFactory } from 'ldo/foafProfile.ldoFactory'
import { FoafProfile } from 'ldo/foafProfile.typings'
import { OidcIssuerFactory } from 'ldo/oidc.ldoFactory'
import { OidcIssuer } from 'ldo/oidc.typings'
import { TypeRegistrationFactory } from 'ldo/publicTypeIndex.ldoFactory'
import { TypeRegistration } from 'ldo/publicTypeIndex.typings'
import { SolidProfileFactory } from 'ldo/solidProfile.ldoFactory'
import { SolidProfile } from 'ldo/solidProfile.typings'
import { AuthorizationFactory } from 'ldo/wac.ldoFactory'
import { Authorization } from 'ldo/wac.typings'
import { merge } from 'lodash'
import { ldo2json } from 'utils/ldo'

const ldoBaseQuery =
  <T extends Record<string, any>>(): BaseQueryFn<
    {
      url: string
      document: string
      factory: LdoFactory<T>
      data?: Partial<T>
    },
    T,
    unknown
  > =>
  async ({ url, document, factory, data }) => {
    let documentUrl = document ?? url
    let response: Response

    try {
      response = await fetch(documentUrl)
    } catch (error) {
      const redirect = await globalThis.fetch(documentUrl, { method: 'GET' })
      documentUrl = redirect.url
      response = await fetch(documentUrl)
    }

    const ldo = response.ok
      ? await factory.parse(url, await response.text(), {
          baseIRI: documentUrl,
        })
      : factory.new(url)

    // if data are present, perform update
    if (data) {
      merge(ldo, data)

      await fetch(documentUrl, {
        method: 'PATCH',
        body: await ldo.$toSparqlUpdate(),
        headers: { 'content-type': 'application/sparql-update' },
      })
    }

    const responseData = ldo2json(ldo)
    return { data: responseData }
  }

export const api = createApi({
  reducerPath: 'api',
  baseQuery: ldoBaseQuery(),
  tagTypes: ['Profile'],
  endpoints: builder => ({
    readUser: builder.query<FoafProfile, string>({
      query: (url: string) => ({ url, factory: FoafProfileFactory }),
      providesTags: (result, error, url) => [{ type: 'Profile', id: url }],
    }),
    readDocumentUrl: builder.query<string, string>({
      queryFn: async url => ({ data: (await globalThis.fetch(url)).url }),
    }),
    readOidcIssuer: builder.query<OidcIssuer, string>({
      query: (url: string) => ({ url, factory: OidcIssuerFactory }),
    }),
    readSolidProfile: builder.query<SolidProfile, string>({
      query: (webId: string) => ({ url: webId, factory: SolidProfileFactory }),
    }),
    updateUser: builder.mutation<
      unknown,
      { id: string; document?: string; data: Partial<FoafProfile> }
    >({
      query: ({ id, document, data }) => ({
        url: id,
        document,
        factory: FoafProfileFactory,
        data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Profile', id }],
    }),
    saveAccess: builder.mutation<unknown, { url: string; data: Authorization }>(
      {
        query: ({ url, data }) => ({
          url: url + '.acl',
          data,
          factory: AuthorizationFactory,
        }),
      },
    ),
    saveIndex: builder.mutation<
      unknown,
      { index: string; id: string; type: string; location: string }
    >({
      query: ({ index, id, type, location }) => {
        const isForContainer = location.charAt(location.length - 1)
        const document = index
        const url = document + id
        const data: TypeRegistration = {
          '@id': id,
          type: { '@id': 'TypeRegistration' },
          forClass: [{ '@id': type }],
          [isForContainer ? 'instanceContainer' : 'instance']: [
            { '@id': location },
          ],
        }

        const factory = TypeRegistrationFactory

        return { url, document, data, factory }
      },
    }),
    // provide url of container and solid pod will assign a random filename
    createFile: builder.mutation<string | null, { url: string; data: File }>({
      queryFn: async ({ url, data }) => {
        const response = await fetch(url, { method: 'POST', body: data })

        const location = response.headers.get('location')

        return { data: location }
      },
    }),
    deleteFile: builder.mutation<void, string>({
      queryFn: async url => {
        await fetch(url, { method: 'DELETE' })
        return { data: undefined }
      },
    }),
  }),
})
