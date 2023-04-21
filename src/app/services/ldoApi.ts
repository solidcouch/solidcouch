import { fetch } from '@inrupt/solid-client-authn-browser'
import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react'
import {
  commitTransaction,
  createLdoDataset,
  parseRdf,
  ShapeType,
  startTransaction,
  toSparqlUpdate,
} from 'ldo'
import { FoafProfileShapeType } from 'ldo/foafProfile.shapeTypes'
import { FoafProfile } from 'ldo/foafProfile.typings'
import { OidcIssuerShapeType } from 'ldo/oidc.shapeTypes'
import { OidcIssuer } from 'ldo/oidc.typings'
import {
  PublicTypeIndexShapeType,
  TypeRegistrationShapeType,
} from 'ldo/publicTypeIndex.shapeTypes'
import { PublicTypeIndex, TypeRegistration } from 'ldo/publicTypeIndex.typings'
import { SolidProfileShapeType } from 'ldo/solidProfile.shapeTypes'
import { SolidProfile } from 'ldo/solidProfile.typings'
import { AuthorizationShapeType } from 'ldo/wac.shapeTypes'
import { Authorization } from 'ldo/wac.typings'
import { has, matches, merge, pick } from 'lodash'
import mergeWith from 'lodash/mergeWith'
import { solid } from 'rdf-namespaces'
import { URI } from 'types'
import { ldo2json } from 'utils/ldo'
import { rdf } from 'utils/rdf-namespaces'
import { createFile, deleteFile, readImage } from './generic'

const ldoBaseQuery =
  <T extends Record<string, any>>(): BaseQueryFn<
    {
      url: string // url of the searched object
      type?: string // type of the searched objects
      document: string
      shapeType: ShapeType<T>
      data?: Partial<T>
    },
    T | T[],
    unknown
  > =>
  async ({ url, document, shapeType, data, type }) => {
    let documentUrl = document ?? url
    let response: Response

    try {
      response = await fetch(documentUrl)
    } catch (error) {
      const redirect = await globalThis.fetch(documentUrl, { method: 'GET' })
      documentUrl = redirect.url
      response = await fetch(documentUrl)
    }

    const body = await response.text()

    const ldoDataset = response.ok
      ? await parseRdf(body, { baseIRI: documentUrl })
      : createLdoDataset()

    if (type) {
      const ldos = ldoDataset.usingType(shapeType).matchSubject(rdf.type, type)
      return { data: ldo2json(ldos) }
    } else {
      const ldo = ldoDataset.usingType(shapeType).fromSubject(url)

      if (data) {
        startTransaction(ldo)

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

        commitTransaction(ldo)

        await fetch(documentUrl, {
          method: 'PATCH',
          body: await toSparqlUpdate(ldo),
          headers: { 'content-type': 'application/sparql-update' },
        })
      }

      return { data: await ldo2json(ldo) }
    }
  }

export const ldoApi = createApi({
  reducerPath: 'api',
  baseQuery: ldoBaseQuery(),
  tagTypes: ['Profile', 'TypeRegistration', 'SolidProfile'],
  endpoints: builder => ({
    readUser: builder.query<FoafProfile, string>({
      query: (url: string) => ({ url, shapeType: FoafProfileShapeType }),
      providesTags: (result, error, url) => [{ type: 'Profile', id: url }],
    }),
    updateUser: builder.mutation<
      unknown,
      { id: string; document?: string; data: Partial<FoafProfile> }
    >({
      query: ({ id, document, data }) => ({
        url: id,
        document,
        shapeType: FoafProfileShapeType,
        data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Profile', id }],
    }),
    readDocumentUrl: builder.query<string, string>({
      queryFn: async url => ({ data: (await globalThis.fetch(url)).url }),
    }),
    readOidcIssuer: builder.query<OidcIssuer, string>({
      query: (url: string) => ({ url, shapeType: OidcIssuerShapeType }),
    }),
    readSolidProfile: builder.query<SolidProfile, string>({
      query: (webId: string) => ({
        url: webId,
        shapeType: SolidProfileShapeType,
      }),
      providesTags: (result, error, url) => [{ type: 'SolidProfile', id: url }],
    }),
    saveSolidProfile: builder.mutation<
      unknown,
      { id: string; data: Partial<SolidProfile> }
    >({
      query: ({ id, data }) => ({
        url: id,
        shapeType: SolidProfileShapeType,
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
          shapeType: AuthorizationShapeType,
        }),
      },
    ),
    readTypeRegistrations: builder.query<TypeRegistration[], string>({
      query: url => ({
        document: url,
        type: solid.TypeRegistration,
        shapeType: TypeRegistrationShapeType,
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

        return { url: index, data, shapeType: PublicTypeIndexShapeType }
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'TypeRegistration', id: arg.index },
      ],
    }),
    // provide url of container and solid pod will assign a random filename
    createFile: builder.mutation<string | null, { url: URI; data: File }>({
      queryFn: async ({ url, data }) => {
        return { data: await createFile(url, data) }
      },
    }),
    deleteFile: builder.mutation<void, URI>({
      queryFn: async url => {
        await deleteFile(url)
        return { data: undefined }
      },
    }),
    readImage: builder.query<string, URI>({
      queryFn: async url => ({ data: await readImage(url) }),
    }),
  }),
})
