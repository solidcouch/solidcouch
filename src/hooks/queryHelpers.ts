import type { UseQueryResult } from '@tanstack/react-query'
import { isEqual, zip } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { URI } from 'types'

/**
 * Get memoized array of data from react-query's useQueries result (array of results)
 * The name is overloaded: it's hook, and we also use results (i.e. get result data). We basically just map results to array of data, memoized
 * @param results
 * @returns
 */
export const useResults = (results: UseQueryResult<string, unknown>[]) => {
  const docs = useMemo(() => results.map(result => result.data), [results])
  return docs
}

/**
 * Asynchronously parse list of documents
 * @param ids
 * @param docs
 * @param parse
 * @param transform
 * @returns
 */
export const useParse = <T, U = T[]>(
  ids: URI[],
  docs: (string | undefined)[],
  parse: (id: URI, doc: string | undefined) => Promise<T>,
  transform: (a: T[], ids?: URI[]) => U = a => a as U,
) => {
  const [results, setResults] = useState<U>(transform([], []))

  useEffect(() => {
    ;(async () => {
      const res = await Promise.all(
        zip(ids, docs).map(
          async props => await parse(props[0] as URI, props[1]),
        ),
      )
      const newResults = transform(res, ids)
      setResults(state => (isEqual(state, newResults) ? state : newResults))
    })()
  }, [docs, ids, parse, transform])

  return results
}

export const useParseWithParam = <T, P, U = T[]>(
  ids: URI[],
  params: P[],
  docs: (string | undefined)[],
  parse: (id: URI, param: P, doc: string | undefined) => Promise<T>,
  transform: (a: T[], params: P[], ids?: URI[]) => U = a => a as U,
) => {
  const [results, setResults] = useState<U>(transform([], []))

  useEffect(() => {
    ;(async () => {
      const res = await Promise.all(
        zip(ids, params, docs).map(
          async props => await parse(props[0] as URI, props[1] as P, props[2]),
        ),
      )
      const newResults = transform(res, params, ids)
      setResults(state => (isEqual(state, newResults) ? state : newResults))
    })()
  }, [docs, ids, params, parse, transform])

  return results
}

/**
 * Asynchronously parse document
 * @param id
 * @param doc
 * @param parse
 * @returns
 */
export const useParseOne = <T>(
  id: URI,
  doc: string | undefined,
  parse: (id: URI, doc: string | undefined) => Promise<T>,
): T | undefined => {
  const [result, setResult] = useState<T>()

  useEffect(() => {
    ;(async () => {
      const newResult = await parse(id, doc)
      setResult(state => (isEqual(state, newResult) ? state : newResult))
    })()
  }, [doc, id, parse])

  return result
}
