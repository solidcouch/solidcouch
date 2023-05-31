import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { createLdoDataset, ShapeType, toTurtle } from 'ldo'
import { LdoBase } from 'ldo/dist/util'
import { merge } from 'lodash'
import { useMemo } from 'react'
import { URI } from 'types'
import { fullFetch, removeHashFromURI } from 'utils/helpers'
/**
 * Fetch Solid document with react-query
 * @param uri
 * @returns
 */
export const useRdfDocument = (uri: URI) => {
  const doc = uri ? removeHashFromURI(uri) : uri
  const queryKey = useMemo(() => ['rdfDocument', doc], [doc])

  const result = useQuery(queryKey, () => fetchTurtle(doc), { enabled: !!uri })
  return result
}

export const useRdfDocuments = (uris: URI[]) => {
  const params = useMemo(
    () => ({
      queries: uris
        .map(uri => removeHashFromURI(uri))
        .map(doc => ({
          queryKey: ['rdfDocument', doc],
          queryFn: () => fetchTurtle(doc),
        })),
    }),
    [uris],
  )

  const results = useQueries(params)
  return results
}

const fetchTurtle = async (uri: URI) =>
  await fullFetch(uri).then(res => {
    if (res.ok) return res.text()
    else throw new Error(`Fetching ${uri} not successful`)
  })

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
