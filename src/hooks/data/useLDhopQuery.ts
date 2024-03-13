import { QueryAndStore, RdfQuery } from '@ldhop/core'
import { fetchRdfDocument } from '@ldhop/core/dist/utils/helpers'
import { QueryKey, UseQueryResult, useQueries } from '@tanstack/react-query'
import mapValues from 'lodash/mapValues'
import { Quad, Store } from 'n3'
import { useEffect, useMemo, useRef, useState } from 'react'

type Fetch = typeof globalThis.fetch

type Variables = { [variable: string]: string[] | undefined }
const defaultGetAdditionalData = () => ({})

export const useLDhopQuery = <AdditionalData extends object = {}>({
  query,
  variables,
  fetch,
  getQueryKey = resource => ['rdfDocument', resource],
  staleTime = Infinity,
  getAdditionalData = defaultGetAdditionalData as () => AdditionalData,
}: {
  query: RdfQuery
  variables: Variables
  fetch: Fetch
  getQueryKey?: (resource: string) => QueryKey
  staleTime?: number
  getAdditionalData?: (
    results: UseQueryResult<
      {
        data: Quad[]
        response: Response
      },
      Error
    >[],
  ) => AdditionalData
}) => {
  const variableSets = useMemo(
    () => mapValues(variables, array => new Set(array)),
    [variables],
  )

  const [resources, setResources] = useState<string[]>([])
  const [outputVariables, setOutputVariables] = useState<Variables>({})
  const [outputStore, setOutputStore] = useState<Store>(new Store())

  const results = useQueries({
    queries: resources.map(resource => ({
      queryKey: getQueryKey(resource),
      queryFn: () => fetchRdfDocument(resource, fetch),
      staleTime,
    })),
    combine: results => ({
      ...(getAdditionalData?.(results) ?? {}),
      data: results
        .map((result, i) => [result, resources[i]] as const)
        .filter(([result]) => result.status === 'success' && result.data)
        .map(([result, resource]) => ({ data: result.data!.data, resource })),
      pending: results.some(result => result.isPending),
    }),
  })

  const qas = useRef<QueryAndStore>(new QueryAndStore(query, variableSets))
  const lastResults = useRef<typeof results>(results)

  // if query or variables change, restart the query
  useEffect(() => {
    qas.current = new QueryAndStore(query, variableSets)
    setResources([])
  }, [query, variableSets])

  useEffect(() => {
    for (const result of results.data) {
      // find results that weren't added, yet
      if (!result || lastResults.current.data.includes(result)) continue
      // put them to QueryAndStore
      qas.current.addResource(result.resource, result.data)
    }

    // get resources that weren't added, and add them to resources
    const missingResources = qas.current.getMissingResources()

    setResources(resources => {
      const newResources: string[] = []
      for (const r of missingResources)
        if (!resources.includes(r)) newResources.push(r)

      if (newResources.length === 0) return resources
      else return [...resources, ...newResources]
    })

    setOutputVariables(
      mapValues(qas.current.getAllVariables(), uriSet => Array.from(uriSet)),
    )

    setOutputStore(qas.current.store)

    lastResults.current = results
  }, [resources, results])

  return useMemo(
    () => ({
      store: outputStore,
      variables: outputVariables,
      qas: qas.current,
      isLoading: results.pending,
    }),
    [outputStore, outputVariables, results.pending],
  )
}
