import { fetch } from '@inrupt/solid-client-authn-browser'
import { fetchRdfDocument as fetchRdfDocumentLdhop } from '@ldhop/core'
import {
  LdoBase,
  LdoBuilder,
  ShapeType,
  createLdoDataset,
  parseRdf,
  setLanguagePreferences,
  startTransaction,
  toTurtle,
} from '@ldo/ldo'
import {
  QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { maxBy, merge } from 'lodash'
import { useMemo } from 'react'
import { URI } from 'types'
import {
  fullFetch,
  getAllParents,
  getParent,
  removeHashFromURI,
} from 'utils/helpers'
import { toN3Patch } from 'utils/ldo'

export const fetchRdfDocument = (uri: string) =>
  fetchRdfDocumentLdhop(uri, fetch)

/**
 * wrapper around react-query to fetch a single rdf document
 */
// eslint-disable-next-line import/no-unused-modules
export const useRdfDocument = (uri: URI) => {
  const doc = uri ? removeHashFromURI(uri) : uri
  const queryKey = useMemo(() => ['rdfDocument', doc], [doc])

  const result = useQuery({
    queryKey,
    queryFn: () => fetchRdfDocument(doc),
    enabled: !!uri,
  })
  return result
}

/**
 * wrapper around react-query to fetch multiple rdf documents
 */
export const useRdfDocuments = (uris: URI[]) => {
  const params = useMemo(
    () => ({
      queries: uris
        .map(uri => removeHashFromURI(uri))
        .map(doc => ({
          queryKey: ['rdfDocument', doc],
          queryFn: () => fetchRdfDocument(doc),
        })),
    }),
    [uris],
  )

  const results = useQueries(params)
  return results
}

/**
 * Create a RDF container specified by a URI
 * TODO if needed it should also be possible to use POST request here
 * https://solidproject.org/TR/protocol#writing-resources
 */
export const useCreateRdfContainer = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri }: { uri: URI }) => {
      if (uri.slice(-1) !== '/')
        throw new Error(`Container must end with "/", got ${uri}`)
      const response = await fullFetch(uri, {
        method: 'PUT',
        headers: {
          'content-type': 'text/turtle',
          Link: '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
          'If-None-Match': '*',
        },
      })

      const location = response.headers.get('location')
      return location as string
    },
    onSuccess: onSuccessInvalidate(queryClient),
  })
  return mutation
}

export const useCreateRdfDocument = <S extends LdoBase>(
  shapeType: ShapeType<S>,
) => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({
      uri,
      data,
      language = 'en',
      method = 'PUT',
    }: {
      uri: URI
      data: S | S[]
      language?: string
      method?: 'POST' | 'PUT'
    }) => {
      const ldoDataset = createLdoDataset()
      if (Array.isArray(data)) {
        data.forEach(datum => {
          const ldo = ldoDataset.usingType(shapeType).fromSubject(datum['@id'])
          setLanguagePreferences(language).using(ldo)
          merge(ldo, datum)
        })
      } else {
        const ldo = ldoDataset.usingType(shapeType).fromSubject(data['@id'])
        setLanguagePreferences(language).using(ldo)
        merge(ldo, data)
      }
      const body = await toTurtle(
        ldoDataset.usingType(shapeType).fromSubject(''),
      )

      const headers: HeadersInit = { 'content-type': 'text/turtle' }
      // let's make sure we don't overwrite an existing resource
      // https://solidproject.org/TR/protocol#conditional-update
      if (method === 'PUT') headers['If-None-Match'] = '*'

      const response = await fullFetch(uri, { method, body, headers })

      const location = response.headers.get('location')
      return location as string
    },
    onSuccess: onSuccessInvalidate(queryClient),
  })

  return mutation
}

export const useUpdateRdfDocument = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri, patch }: { uri: URI; patch: string }) => {
      return await fullFetch(uri, {
        method: 'PATCH',
        body: patch,
        headers: { 'content-type': 'text/n3' },
      })
    },
    onSuccess: onSuccessInvalidate(queryClient, data => data.status === 201),
  })
  return mutation
}

export const useUpdateLdoDocument = <S extends LdoBase>(
  shapeType: ShapeType<S>,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      uri,
      subject,
      transform,
      language = 'en',
    }: {
      uri: URI
      subject: URI
      transform: (ldo: S) => void // transform should modify the original input, not clone it
      language?: string
    }) => {
      const originalResponse = await fullFetch(uri)
      let originalData = ''
      if (originalResponse.ok) originalData = await originalResponse.text()
      const ldoDataset = await parseRdf(originalData, { baseIRI: uri })
      const ldo = ldoDataset.usingType(shapeType).fromSubject(subject)

      setLanguagePreferences(language).using(ldo)

      startTransaction(ldo)
      transform(ldo)

      const patch = await toN3Patch(ldo)
      return await fullFetch(uri, {
        method: 'PATCH',
        body: patch,
        headers: { 'content-type': 'text/n3' },
      })
    },
    onSuccess: onSuccessInvalidate(queryClient, data => data.status === 201),
  })
}

export const useMatchUpdateLdoDocument = <S extends LdoBase>(
  shapeType: ShapeType<S>,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      uri,
      match,
      transform,
      language = 'en',
    }: {
      uri: URI
      match: (builder: LdoBuilder<S>) => S
      transform: (ldo: S) => void // transform should modify the original input, not clone it
      language?: string
    }) => {
      const originalResponse = await fullFetch(uri)
      let originalData = ''
      if (originalResponse.ok) originalData = await originalResponse.text()
      const ldoDataset = await parseRdf(originalData, { baseIRI: uri })
      const builder = ldoDataset.usingType(shapeType)

      const ldo = match(builder)

      setLanguagePreferences(language).using(ldo)

      startTransaction(ldo)
      transform(ldo)

      const patch = await toN3Patch(ldo)
      return await fullFetch(uri, {
        method: 'PATCH',
        body: patch,
        headers: { 'content-type': 'text/n3' },
      })
    },
    onSuccess: onSuccessInvalidate(queryClient, data => data.status === 201),
  })
}

export const useDeleteRdfDocument = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri }: { uri: URI }) => {
      await fullFetch(uri, { method: 'DELETE' })
    },
    onSuccess: onSuccessInvalidate(queryClient),
  })
  return mutation
}

/**
 * Look through ancestor containers of uri, and invalidate the nearest cached one
 */
const getCachedAncestor = (uri: URI, queryClient: QueryClient) => {
  const parents = getAllParents(uri)
  const cachedParents = queryClient
    .getQueryCache()
    .getAll()
    .filter(
      query =>
        query.queryKey[0] === 'rdfDocument' &&
        typeof query.queryKey[1] === 'string' &&
        parents.includes(query.queryKey[1]),
    )
    .map(query => query.queryKey[1] as URI)
  const longestCachedParent = maxBy(cachedParents, str => str.length)
  return longestCachedParent
}

/**
 * invalidate uri and its nearest existing ancestor container
 */
const onSuccessInvalidate =
  <Data = Response>(
    queryClient: QueryClient,
    checkStatus: (data: Data) => boolean = () => true,
  ) =>
  <Variables extends { uri: URI }>(data: Data, variables: Variables) => {
    const uri = removeHashFromURI(variables.uri)
    queryClient.invalidateQueries({ queryKey: ['rdfDocument', uri] })
    // TODO this may not be necessary
    queryClient.invalidateQueries({ queryKey: ['rdfDocument', getParent(uri)] })

    // when stuff is created, containing folder is also changed
    if (checkStatus(data)) {
      const cachedAncestor = getCachedAncestor(uri, queryClient)
      if (cachedAncestor)
        queryClient.invalidateQueries({
          queryKey: ['rdfDocument', cachedAncestor],
        })
    }
  }
