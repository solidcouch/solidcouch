import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createLdoDataset,
  parseRdf,
  ShapeType,
  startTransaction,
  toTurtle,
} from 'ldo'
import { LdoBase } from 'ldo/dist/util'
import { merge } from 'lodash'
import { DataFactory, Parser, ParserOptions, Quad } from 'n3'
import { useMemo } from 'react'
import { URI } from 'types'
import type { Required } from 'utility-types'
import { fullFetch, removeHashFromURI } from 'utils/helpers'
import { toN3Patch } from 'utils/ldo'

export const useRdfDocument = (uri: URI) => {
  const doc = uri ? removeHashFromURI(uri) : uri
  const queryKey = useMemo(() => ['rdfDocument', doc], [doc])

  const result = useQuery(queryKey, () => fetchRdfDocument(doc), {
    enabled: !!uri,
  })
  return result
}

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

export const useCreateRdfDocument = <S extends LdoBase>(
  shapeType: ShapeType<S>,
) => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri, data }: { uri: URI; data: S | S[] }) => {
      const ldoDataset = createLdoDataset()
      if (Array.isArray(data)) {
        data.forEach(datum => {
          const ldo = ldoDataset.usingType(shapeType).fromSubject(datum['@id'])
          merge(ldo, datum)
        })
      } else {
        const ldo = ldoDataset.usingType(shapeType).fromSubject(data['@id'])
        merge(ldo, data)
      }
      const turtleData = await toTurtle(
        ldoDataset.usingType(shapeType).fromSubject(''),
      )

      const response = await fullFetch(uri, {
        method: 'PUT',
        body: turtleData,
        headers: {
          'content-type': 'text/turtle',
          // 'If-None-Match': '*'
        },
      })

      const location = response.headers.get('location')
      return location as string
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'rdfDocument',
        removeHashFromURI(variables.uri),
      ])
    },
  })

  return mutation
}

export const useUpdateRdfDocument = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri, patch }: { uri: URI; patch: string }) => {
      await fullFetch(uri, {
        method: 'PATCH',
        body: patch,
        headers: { 'content-type': 'text/n3' },
      })
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'rdfDocument',
        removeHashFromURI(variables.uri),
      ])
    },
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
    }: {
      uri: URI
      subject: URI
      transform: (ldo: S) => void // transform should modify the original input, not clone it
    }) => {
      const originalResponse = await fullFetch(uri)
      const originalData = await originalResponse.text()
      const ldoDataset = await parseRdf(originalData, { baseIRI: uri })
      const ldo = ldoDataset.usingType(shapeType).fromSubject(subject)

      startTransaction(ldo)
      transform(ldo)

      const patch = await toN3Patch(ldo)
      await fullFetch(uri, {
        method: 'PATCH',
        body: patch,
        headers: { 'content-type': 'text/n3' },
      })
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'rdfDocument',
        removeHashFromURI(variables.uri),
      ])
    },
  })
}

export const useDeleteRdfDocument = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri }: { uri: URI }) => {
      await fullFetch(uri, { method: 'DELETE' })
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'rdfDocument',
        removeHashFromURI(variables.uri),
      ])
    },
  })
  return mutation
}
