import {
  QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  ShapeType,
  createLdoDataset,
  parseRdf,
  setLanguagePreferences,
  startTransaction,
  toTurtle,
} from 'ldo'
import { LdoBase } from 'ldo/dist/util'
import { maxBy, merge } from 'lodash'
import { DataFactory, Parser, ParserOptions, Quad } from 'n3'
import { useMemo } from 'react'
import { URI } from 'types'
import type { Required } from 'utility-types'
import { fullFetch, getAllParents, removeHashFromURI } from 'utils/helpers'
import { toN3Patch } from 'utils/ldo'

/**
 * wrapper around react-query to fetch a single rdf document
 */
// eslint-disable-next-line import/no-unused-modules
export const useRdfDocument = (uri: URI) => {
  const doc = uri ? removeHashFromURI(uri) : uri
  const queryKey = useMemo(() => ['rdfDocument', doc], [doc])

  const result = useQuery(queryKey, () => fetchRdfDocument(doc), {
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
 * Fetch rdf document
 * parse it into rdf Dataset
 * add document url as graph
 */
const fetchRdfDocument = async (uri: URI) => {
  const res = await fullFetch(uri)

  if (res.ok) {
    const data = await res.text()
    return { data: parseRdfToQuads(data, { baseIRI: uri }), response: res }
  } else throw new Error(`Fetching ${uri} not successful`)
}

const parseRdfToQuads = (
  data: string,
  options: Required<ParserOptions, 'baseIRI'>,
): Quad[] => {
  // Create a new empty RDF store to hold the parsed data

  const parser = new Parser(options)
  // Parse the input data and add the resulting quads to the store
  const graph = DataFactory.namedNode(options.baseIRI)
  const quads = parser
    .parse(data)
    .map(({ subject, predicate, object }) =>
      DataFactory.quad(subject, predicate, object, graph),
    )

  return quads
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
      const turtleData = await toTurtle(
        ldoDataset.usingType(shapeType).fromSubject(''),
      )

      const response = await fullFetch(uri, {
        method,
        body: turtleData,
        headers: {
          'content-type': 'text/turtle',
          // 'If-None-Match': '*'
        },
      })

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
    queryClient.invalidateQueries(['rdfDocument', uri])

    // when stuff is created, containing folder is also changed
    if (checkStatus(data)) {
      const cachedAncestor = getCachedAncestor(uri, queryClient)
      if (cachedAncestor)
        queryClient.invalidateQueries(['rdfDocument', cachedAncestor])
    }
  }
