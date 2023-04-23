import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import { URI } from 'types'
import { fullFetch, removeHashFromURI } from 'utils/helpers'

/**
 * Fetch Solid document with react-query
 * @param uri
 * @returns
 */
export const useSolidDocument = (uri: URI) => {
  const doc = uri ? removeHashFromURI(uri) : uri
  const queryKey = useMemo(() => ['solidDocument', doc], [doc])

  const result = useQuery(queryKey, () => fetchTurtle(doc), { enabled: !!uri })
  return result
}

export const useSolidDocuments = (uris: URI[]) => {
  const params = useMemo(
    () => ({
      queries: uris
        .map(uri => removeHashFromURI(uri))
        .map(doc => ({
          queryKey: ['solidDocument', doc],
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

export const useCreateSolidDocument = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri, data }: { uri: URI; data: string }) => {
      const response = await fullFetch(uri, {
        method: 'PUT',
        body: data,
        headers: { 'content-type': 'text/turtle' },
      })

      const location = response.headers.get('location')
      return location as string
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'solidDocument',
        removeHashFromURI(variables.uri),
      ])
    },
  })

  return mutation
}

export const useUpdateSolidDocument = () => {
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
        'solidDocument',
        removeHashFromURI(variables.uri),
      ])
    },
  })
  return mutation
}

export const useDeleteSolidDocument = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri }: { uri: URI }) => {
      await fullFetch(uri, { method: 'DELETE' })
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'solidDocument',
        removeHashFromURI(variables.uri),
      ])
    },
  })
  return mutation
}
