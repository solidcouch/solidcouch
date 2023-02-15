import { fetch } from '@inrupt/solid-client-authn-browser'
import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react'
import { LdoFactory } from 'ldo'
import { FoafProfileFactory } from 'ldo/foafProfile.ldoFactory'
import { FoafProfile } from 'ldo/foafProfile.typings'
import { OidcIssuerFactory } from 'ldo/oidc.ldoFactory'
import { OidcIssuer } from 'ldo/oidc.typings'
import { merge } from 'lodash'
import { ldo2json } from 'utils/ldo'

const ldoBaseQuery =
  <T extends Record<string, any>>(): BaseQueryFn<
    { url: string; factory: LdoFactory<T>; data?: Partial<T> },
    T,
    unknown
  > =>
  async ({ url, factory, data }) => {
    let raw = ''
    let documentUrl = url
    try {
      raw = await (await fetch(url)).text()
    } catch (error) {
      const response = await globalThis.fetch(url, { method: 'GET' })
      documentUrl = response.url
      raw = await (await fetch(documentUrl)).text()
    }
    const ldo = await factory.parse(url, raw, { baseIRI: documentUrl })

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
    updateUser: builder.mutation<
      unknown,
      { id: string; data: Partial<FoafProfile> }
    >({
      query: ({ id, data }) => ({
        url: id,
        factory: FoafProfileFactory,
        data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Profile', id }],
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
