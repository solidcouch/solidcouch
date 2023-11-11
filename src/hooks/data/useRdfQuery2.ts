import { BlankNode, Literal, NamedNode, Quad, Variable } from '@rdfjs/types'
import { UseQueryResult } from '@tanstack/react-query'
import { difference, throttle, uniq } from 'lodash'
import * as n3 from 'n3'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { URI } from 'types'
import { removeHashFromURI } from 'utils/helpers'
import { StartsWith } from './rdfQueryTypes'
import { useRdfDocuments } from './useRdfDocument'

type VariableDict = {
  [key: string]: (Quad | NamedNode | Literal | BlankNode | Variable)[]
}

type TransformStore = (
  store: n3.Store,
  variables: VariableDict,
  addResource: (resource: URI) => void,
) => void

type Match = {
  type: 'match'
  subject?: string
  predicate?: string
  object?: string
  graph?: string
  pick: 'subject' | 'predicate' | 'object' | 'graph'
  target: `?${string}`
}

type AddResources = { type: 'add resources'; variable: `?${string}` }

const match2Transform = (config: Match): TransformStore => {
  return (store, variables, addResource) => {
    let subjects: n3.NamedNode[] | [null] = [null]
    let predicates: n3.NamedNode[] | [null] = [null]
    let objects: n3.NamedNode[] | [null] = [null]
    let graphs: n3.NamedNode[] | [null] = [null]
    if (config.subject) {
      if (config.subject.charAt(0) === '?') {
        subjects = variables[config.subject.slice(1)].filter(
          v => v.termType === 'NamedNode',
        ) as n3.NamedNode[]

        addResources2Transform({
          type: 'add resources',
          variable: config.subject as `?${string}`,
        })(store, variables, addResource)
      } else {
        subjects = [new n3.NamedNode(config.subject)]
      }
    }
    if (config.predicate) {
      predicates = [new n3.NamedNode(config.predicate)]
    }
    if (config.object) {
      if (config.object.charAt(0) === '?') {
        objects = variables[config.object.slice(1)].filter(
          v => v.termType === 'NamedNode',
        ) as n3.NamedNode[]

        addResources2Transform({
          type: 'add resources',
          variable: config.object as `?${string}`,
        })(store, variables, addResource)
      } else {
        objects = [new n3.NamedNode(config.object)]
      }
    }
    if (config.graph) {
      if (config.graph.charAt(0) === '?') {
        graphs = variables[config.graph.slice(1)].filter(
          v => v.termType === 'NamedNode',
        ) as n3.NamedNode[]

        // TODO maybe graph isn't called NamedNode but DefaultGraph ??
        addResources2Transform({
          type: 'add resources',
          variable: config.graph as `?${string}`,
        })(store, variables, addResource)
      } else {
        graphs = [new n3.NamedNode(config.graph)]
      }
    }

    /* TODO this is the command that blocks the UI
     * Single store.match is probably O(1), but e.g. when we're looping over many subjects, the complexity can easily grow to O(n) or worse
     * we may want to give the JavaScript event loop a space to breath by putting setTimeout(() => {}, 0) somewhere */
    const results = subjects
      .flatMap(s =>
        predicates.flatMap(p =>
          objects.flatMap(o =>
            graphs.flatMap(g => [...store.match(s, p, o, g)]),
          ),
        ),
      )
      .map(q => q[config.pick])

    const targetKey = config.target.slice(1)
    variables[targetKey] = uniq(
      results.concat(variables[targetKey] ?? []),
    ) as typeof variables.x
  }
}

const addResources2Transform = (config: AddResources): TransformStore => {
  return (store, variables, addResource) => {
    const key = config.variable.slice(1)

    variables[key].forEach(v => {
      if (v.termType === 'NamedNode') {
        addResource(removeHashFromURI(v.value))
      }
    })
  }
}

export type RdfQuery = (TransformStore | Match | AddResources)[]

/**
 * Follow your nose through RDF graph in n3.Store, change it, and discover resources that still need to be fetched, for the RDF graph to be complete
 * @param query RdfQuery - Array of commands to follow your nose
 * This method changes the store in place
 */
const processStore = (
  store: n3.Store,
  query: RdfQuery,
  addResource: (resource: URI) => void,
  initial: { [key: string]: URI[] } = {},
) => {
  const variables: {
    [key: string]: (Quad | NamedNode | Literal | BlankNode | Variable)[]
  } = {}

  for (const key in initial) {
    variables[key] = initial[key].map(uri => new n3.NamedNode(uri))
  }

  query.forEach(q => {
    let transform: TransformStore = () => {}
    if (typeof q === 'function') transform = q
    else if (q.type === 'add resources') transform = addResources2Transform(q)
    else if (q.type === 'match') transform = match2Transform(q)

    transform(store, variables, addResource)
  })
}

/**
 * Set up store, follow your nose through it, and setState if it changed.
 */
const processAndUpdateStore = (
  documents: UseQueryResult<
    {
      data: n3.Quad[]
      response: Response
    },
    unknown
  >[],
  query: RdfQuery,
  addResource: (g: string) => void,
  initial: { [key: string]: string[] },
  setStore: React.Dispatch<
    React.SetStateAction<n3.Store<Quad, n3.Quad, Quad, Quad>>
  >,
) => {
  const store = new n3.Store()
  documents.forEach(({ data }) => data && store.addQuads(data.data))
  processStore(store, query, addResource, initial)
  setStore(s => {
    const previous = [...s].map(
      a => `${a.subject.value} ${a.predicate.value} ${a.object.value}`,
    )
    const current = [...store].map(
      a => `${a.subject.value} ${a.predicate.value} ${a.object.value}`,
    )
    const isDifferent =
      difference(previous, current).length +
        difference(current, previous).length >
      0

    return isDifferent ? store : s
  })
}

/**
 * Follow your nose through Knowledge graph, starting from initial URIs, across multiple resources
 * @param {RdfQuery} query - Array of commands to follow. Available commands are "match", "add resources", and custom process function
 * @param {Object.<string, URI[]>} initial - URIs to start from. It's important that the object is memoized e.g. with useMemo(() => ({ key: [uri] }), [])
 * @param {number} [throttling=0] - [milliseconds] currently, we go through the store in inefficient manner, too often. That can slow down the UI for wide datasets. With this parameter you can limit how often this is done. Disabled by default
 * @returns {[n3.Store, {isLoading: boolean, isEtc: boolean }]} - n3.Store and resource querying status as array tuple
 */
export const useRdfQuery = (
  query: RdfQuery,
  initial: { [key: string]: URI[] } = {},
  throttling: number = 0,
) => {
  const [resources, setResources] = useState<string[]>([])
  const [store, setStore] = useState(new n3.Store())
  const documents = useRdfDocuments(resources)

  const runStoreThrottled = useMemo(
    () =>
      throttling
        ? throttle(processAndUpdateStore, throttling)
        : processAndUpdateStore,
    [throttling],
  )

  const addResource = useCallback((g: string) => {
    setResources(resources =>
      resources.includes(g) ? resources : [...resources, g],
    )
  }, [])

  // TODO This effect runs every time "documents" change. This is way too often. We only need to run this effect whenever some new results are received; not when something starts loading etc...
  useEffect(() => {
    runStoreThrottled(documents, query, addResource, initial, setStore)
  }, [addResource, documents, initial, query, runStoreThrottled])

  return useMemo(
    () => [store, combineStatus(documents)] as const,
    [documents, store],
  )
}

/**
 * Take results of useQueries, and combine boolean values like `isLoading` into a single object.
 * For every field, we combine using ||, with exception of isSuccess, isFetched and isFetchedAfterMount, where we combine using && logical operator.
 * e.g. isLoading === true when something is loading;  isFetched === true when everything is fetched
 */
const combineStatus = (
  results: UseQueryResult<
    {
      data: n3.Quad[]
      response: Response
    },
    unknown
  >[],
) => {
  type CombinedStatus = Record<
    StartsWith<keyof UseQueryResult<any, unknown>, 'is'>,
    boolean
  >

  return results.reduce((result, current) => {
    for (const prop in current) {
      const key = prop as keyof typeof current
      if (typeof key === 'string') {
        if (key.startsWith('is')) {
          const typedKey = key as StartsWith<typeof key, 'is'>
          result[typedKey] ||= Boolean(current[typedKey])
        }
      }
    }

    result.isSuccess &&= current.isSuccess
    result.isFetched &&= current.isFetched
    result.isFetchedAfterMount &&= current.isFetchedAfterMount
    return result
  }, {} as CombinedStatus)
}
