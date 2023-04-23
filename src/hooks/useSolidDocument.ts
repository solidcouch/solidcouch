import { useQueries, useQuery } from '@tanstack/react-query'
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
    else throw new Error('not successful')
  })
