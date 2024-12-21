import { fetch } from '@inrupt/solid-client-authn-browser'
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import { URI } from 'types'
import { removeHashFromURI } from '../../utils/helpers'

/**
 * wrapper around react-query to fetch a single file as object url
 */
export const useFile = (uri: URI = '') => {
  const doc = uri ? removeHashFromURI(uri) : uri
  const queryKey = useMemo(() => ['file', doc], [doc])

  const result = useQuery({
    queryKey,
    queryFn: () => readFile(doc),
    enabled: !!uri,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })
  return result
}

/**
 * wrapper around react-query to fetch multiple files as object urls
 */
// eslint-disable-next-line import/no-unused-modules
export const useFiles = (uris: URI[]) => {
  const params = useMemo(
    () => ({
      queries: uris
        .map(uri => removeHashFromURI(uri))
        .map(doc => ({
          queryKey: ['file', doc],
          queryFn: () => readFile(doc),
        })),
    }),
    [uris],
  )

  const results = useQueries(params)
  return results
}

/**
 * Read authenticated file as object url
 */
const readFile = async (uri: URI) => {
  const res = await fetch(uri)

  if (res.ok) {
    return URL.createObjectURL(await res.blob())
  } else if (res.status === 404) return ''
  else throw new Error(`Fetching ${uri} not successful`)
}

/**
 * Create a file in a Solid pod
 *
 * @param url - container url - a new random name will be given to the new file
 * @param data - file to save
 * @returns url of the newly created file
 */
const createFile = async (url: URI, data: File): Promise<URI> => {
  const response = await fetch(url, { method: 'POST', body: data })

  // return location of the new file
  const location = response.headers.get('location')

  if (!location)
    throw new Error('Location not available (this should not happen)')

  return location
}

/**
 * Create or replace a file in a Solid pod
 *
 * @param url - url to overwrite
 * @param data - file to save
 */
const updateFile = async (url: URI, data: File) => {
  await fetch(url, { method: 'PUT', body: data })
}

/**
 * Delete file from a Solid pod
 *
 * @param url
 */
const deleteFile = async (url: URI) => {
  await fetch(url, { method: 'DELETE' })
}

export const useCreateFile = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri, data }: { uri: URI; data: File }) =>
      await createFile(uri, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['file', removeHashFromURI(variables.uri)],
      })
    },
  })

  return mutation
}

// eslint-disable-next-line import/no-unused-modules
export const useUpdateFile = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri, data }: { uri: URI; data: File }) =>
      await updateFile(uri, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['file', removeHashFromURI(variables.uri)],
      })
    },
  })

  return mutation
}

export const useDeleteFile = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ uri }: { uri: URI }) => await deleteFile(uri),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['file', removeHashFromURI(variables.uri)],
      })
    },
  })

  return mutation
}
