import { fetch } from '@inrupt/solid-client-authn-browser'
import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react'
import { LdoFactory } from 'ldo'
import { FoafProfileFactory } from 'ldo/foafProfile.ldoFactory'
import { FoafProfile } from 'ldo/foafProfile.typings'
import { OidcIssuerFactory } from 'ldo/oidc.ldoFactory'
import { OidcIssuer } from 'ldo/oidc.typings'
import {
  PublicTypeIndexFactory,
  TypeRegistrationFactory,
} from 'ldo/publicTypeIndex.ldoFactory'
import { PublicTypeIndex, TypeRegistration } from 'ldo/publicTypeIndex.typings'
import { SolidProfileFactory } from 'ldo/solidProfile.ldoFactory'
import { SolidProfile } from 'ldo/solidProfile.typings'
import { AuthorizationFactory } from 'ldo/wac.ldoFactory'
import { Authorization } from 'ldo/wac.typings'
import { has, matches, merge, mergeWith, pick } from 'lodash'
import { rdf, solid } from 'rdf-namespaces'
import { ldo2json, rdf2n3 } from 'utils/ldo'

const ldoBaseQuery =
  <T extends Record<string, any>>(): BaseQueryFn<
    {
      url: string // url of the searched object
      type?: string // type of the searched objects
      document: string
      factory: LdoFactory<T>
      data?: Partial<T>
    },
    T | T[],
    unknown
  > =>
  async ({ url, document, factory, data, type }) => {
    let documentUrl = document ?? url
    let response: Response

    try {
      response = await fetch(documentUrl)
    } catch (error) {
      const redirect = await globalThis.fetch(documentUrl, { method: 'GET' })
      documentUrl = redirect.url
      response = await fetch(documentUrl)
    }

    if (type && response.ok) {
      const raw = await response.text()

      const quads = await rdf2n3(raw, documentUrl)
      const ids = quads
        .filter(q => q.predicate.value === rdf.type && q.object.value === type)
        .map(q => q.subject.id)

      const responseDatas = await Promise.all(
        ids.map(id => factory.parse(id, raw, { baseIRI: documentUrl })),
      )

      return { data: responseDatas.map(ldo => ldo2json(ldo)) }
    }

    const ldo = response.ok
      ? await factory.parse(url, await response.text(), {
          baseIRI: documentUrl,
        })
      : factory.new(url)

    // if data are present, perform update
    if (data) {
      mergeWith(ldo, data, (obj, src) => {
        if (Array.isArray(obj)) {
          src.forEach((el: any) => {
            const elIndex = has(el, '@id')
              ? obj.findIndex(matches(pick(el, '@id')))
              : -1

            if (elIndex >= 0) {
              merge(obj[elIndex], el)
              // fix issue with merging types (nested ldo objects don't assign type with _.merge
              if (has(el, 'type')) {
                obj[elIndex].type = el.type
              }
            } else obj.push(el)
          })
          return obj
        }
      })

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
  tagTypes: ['Profile', 'TypeRegistration', 'SolidProfile'],
  endpoints: builder => ({
    readUser: builder.query<FoafProfile, string>({
      query: (url: string) => ({ url, factory: FoafProfileFactory }),
      providesTags: (result, error, url) => [{ type: 'Profile', id: url }],
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
    readDocumentUrl: builder.query<string, string>({
      queryFn: async url => ({ data: (await globalThis.fetch(url)).url }),
    }),
    readOidcIssuer: builder.query<OidcIssuer, string>({
      query: (url: string) => ({ url, factory: OidcIssuerFactory }),
    }),
    readSolidProfile: builder.query<SolidProfile, string>({
      query: (webId: string) => ({ url: webId, factory: SolidProfileFactory }),
      providesTags: (result, error, url) => [{ type: 'SolidProfile', id: url }],
    }),
    saveSolidProfile: builder.mutation<
      unknown,
      { id: string; data: Partial<SolidProfile> }
    >({
      query: ({ id, data }) => ({
        url: id,
        factory: SolidProfileFactory,
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SolidProfile', id },
      ],
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
    readTypeRegistrations: builder.query<TypeRegistration[], string>({
      query: url => ({
        document: url,
        type: solid.TypeRegistration,
        factory: TypeRegistrationFactory,
      }),
      providesTags: (result, error, arg) => [
        { type: 'TypeRegistration', id: arg },
      ],
    }),
    saveTypeRegistration: builder.mutation<
      unknown,
      { index: string; id: string; type: string; location: string }
    >({
      query: ({ index, id, type, location }) => {
        const isForContainer = location.charAt(location.length - 1) === '/'
        const data: PublicTypeIndex = {
          type: [{ '@id': 'TypeIndex' }, { '@id': 'ListedDocument' }],
          references: [
            {
              '@id': id,
              type: { '@id': 'TypeRegistration' },
              forClass: [{ '@id': type }],
              [isForContainer ? 'instanceContainer' : 'instance']: [
                { '@id': location },
              ],
            },
          ],
        }

        return { url: index, data, factory: PublicTypeIndexFactory }
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'TypeRegistration', id: arg.index },
      ],
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
