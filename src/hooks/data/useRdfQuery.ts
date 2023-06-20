/**
 * Fetch query with LDO
 * start
 * me -> seeAlso -> ?profileDocument // resource discovery
 * me -> publicTypeIndex -> ?publicTypeIndex
 * ?publicTypeIndex -> references -> ?typeRegistration
 * ?typeRegistration -> a -> TypeRegistration // filter
 * ?typeRegistration -> forClass -> LongChat // filter
 * ?typeRegistration -> instance -> ?chat
 * ?chat -> participation -> ?participation
 * ?participation -> references -> ?chat
 * containerOf(?chat) -> contains -> ?year
 * ?year -> contains -> ?month
 * ?month -> contains -> ?day
 * ?day -> contains -> ?messageFile // all this is resource discovery
 * ?chat -> message -> ?message
 */
import { createLdoDataset } from 'ldo'
import { LdoBase } from 'ldo/dist/util'
import { difference, uniq, uniqBy } from 'lodash'
import { Quad } from 'n3'
import { useEffect, useMemo, useState } from 'react'
import { URI } from 'types'
import { removeHashFromURI } from 'utils/helpers'
import { CombinedResults, Query, ResultsOf, StartsWith } from './rdfQueryTypes'
import { useRdfDocuments } from './useRdfDocument'

/**
 * Fetch data with following your nose and showing results
 */
export const useRdfQuery = <
  Params extends { [key: string]: URI | string },
  Q extends Query<Params>,
>(
  query: Q,
  params: Params,
  language = 'en',
) => {
  const [dataset, ldoResults, combinedQueryResults] = useRdfQueryData(
    query,
    params,
    language,
  )

  return useMemo(
    () => [ldoResults as ResultsOf<Q>, combinedQueryResults, dataset] as const,
    [combinedQueryResults, dataset, ldoResults],
  )
}

export const useRdfQueryData = <Params extends { [key: string]: URI | string }>(
  query: Query<Params>,
  params: Params,
  language: string,
) => {
  const [resources, setResources] = useState<URI[]>([])

  // fetch resources
  const results = useRdfDocuments(resources)

  // collect datasets
  const dataset = useMemo(() => {
    return results.flatMap(result => result.data?.data ?? [])
  }, [results])

  useEffect(() => {
    const [, newResources] = getPartialResults(query, dataset, params, language)
    setResources(oldResources => {
      const diff = difference(Array.from(newResources), oldResources)
      return diff.length > 0 ? Array.from(newResources) : oldResources
    })
  }, [dataset, language, params, query])

  const ldoDict2 = useMemo(() => {
    const [partialResults] = getPartialResults(query, dataset, params, language)
    return partialResults
  }, [dataset, language, params, query])

  // catch the time between new resources are discovered, and start fetching
  const isWorking = useMemo(() => {
    const [, newResources] = getPartialResults(query, dataset, params, language)
    const diff = difference(Array.from(newResources), resources)
    return diff.length > 0
  }, [dataset, language, params, query, resources])

  const combinedResults = useMemo(() => {
    const mergedResults = results.reduce((result, current) => {
      for (const prop in current) {
        const key = prop as keyof typeof current
        if (typeof key === 'string') {
          if (key.startsWith('is')) {
            const typedKey = key as StartsWith<typeof key, 'is'>
            result[typedKey] = Boolean(
              result[typedKey] || Boolean(current[typedKey]),
            )
          } else {
            const typedKey = key as Exclude<
              typeof key,
              StartsWith<typeof key, 'is'>
            >
            result[typedKey] = [
              ...(result[typedKey] ?? []),
              current[typedKey],
            ] as any
          }
        }
      }

      result.isLoading ||= isWorking

      result.isSuccess = current.isSuccess && result.isSuccess
      return result
    }, {} as CombinedResults<typeof results>)
    return mergedResults
  }, [isWorking, results])

  // return the dataset
  return [dataset, ldoDict2, combinedResults, results] as const
}

const getPartialResults = <Params extends { [key: string]: URI | string }>(
  query: Query<Params>,
  dataset: Quad[],
  params: Params,
  language: string,
): [{ [key: string]: LdoBase[] }, Set<URI>] => {
  const ldoDataset = createLdoDataset(dataset)
  const partialResults: { [key: string]: LdoBase[] } = {}
  const necessaryURIs = new Set<URI>()

  // we process the queries one by one according to their order in query
  for (const originalPath of query) {
    // replace path elements starting ? with available params
    const path = originalPath.map(op => {
      if (typeof op === 'string' && op.startsWith('?') && op.slice(1) in params)
        return params[op.slice(1)]
      else return op
    }) as unknown as typeof originalPath

    // fill the necessary URIs
    // when something is necessary as subject, fill it to necessary URIs
    const subjects = uniq(
      path[0].startsWith('?')
        ? partialResults[path[0].slice(1)].map(ldo => ldo?.['@id'] as URI)
        : [path[0]],
    ).filter(a => Boolean(a))
    subjects.forEach(subject => necessaryURIs.add(removeHashFromURI(subject)))

    // when they are 4 elements, start LDO
    if (path.length === 4) {
      const [, fn, to, shapeType] = path

      const toName = to.slice(1)

      const ldos = subjects.map(subject =>
        ldoDataset
          .usingType(shapeType)
          .setLanguagePreferences(language)
          .fromSubject(fn(subject)),
      )
      partialResults[toName] = uniqBy(
        (partialResults[toName] ?? []).concat(ldos),
        '@id',
      ).filter(a => Boolean(a))
    } else if (path.length === 3) {
      const [from, predicate, to] = path

      // if path has 3 elements and object is variable
      // traverse ldos and assign results to partialResults
      if (from.startsWith('?') && to.startsWith('?')) {
        const fromName = from.slice(1)
        const toName = to.slice(1)

        const ldos = partialResults[fromName].flatMap(
          ldoBefore => ldoBefore[predicate],
        )

        partialResults[toName] = uniqBy(
          (partialResults[toName] ?? []).concat(ldos),
          '@id',
        ).filter(a => Boolean(a))
      }
      // if object is constant, filter by this constant
      else if (from.startsWith('?')) {
        const fromName = from.slice(1)
        partialResults[fromName] = partialResults[fromName]
          .filter(ldo =>
            [ldo[predicate]].flat().some((p: any) => p?.['@id'] === to),
          )
          .filter(a => Boolean(a))
      } else {
        throw new Error(`unexpected constant "${from}" in query path subject`)
      }
    }
    // if path has 2 elements, second element should be a filter function
    // that we can apply to each partial result with given name in first element
    else if (path.length === 2) {
      const [from, fn] = path
      if (!from.startsWith('?'))
        throw new Error(
          `Unexpected constant "${from}" in query filter. Please provide a variable that starts with "?"`,
        )
      const fromName = from.slice(1)
      partialResults[fromName] = partialResults[fromName]
        .filter(ldo => fn(ldo, params))
        .filter(a => Boolean(a))
    }
    subjects.forEach(subject => necessaryURIs.add(removeHashFromURI(subject)))
  }
  return [partialResults, necessaryURIs]
}
