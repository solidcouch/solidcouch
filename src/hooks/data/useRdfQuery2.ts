import { BlankNode, Literal, NamedNode, Quad, Variable } from '@rdfjs/types'
import { UseQueryResult } from '@tanstack/react-query'
import { difference, throttle, uniq } from 'lodash'
import * as n3 from 'n3'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { URI } from 'types'
import { removeHashFromURI } from 'utils/helpers'
import { useRdfDocuments } from './useRdfDocument'

const findQuads = (
  store: n3.Store,
  subject: n3.NamedNode | null,
  predicate: n3.NamedNode | null,
  object?: n3.NamedNode | null,
  graph?: n3.NamedNode | null,
) => {
  const matches = store.match(subject, predicate, object, graph)

  return [...matches]
}

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

    const results = subjects
      .flatMap(s =>
        predicates.flatMap(p =>
          objects.flatMap(o =>
            graphs.flatMap(g => findQuads(store, s, p, o, g)),
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

const runStore = (
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
  console.log(Date.now())
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

export const useRdfQuery2 = (
  query: RdfQuery,
  initial: { [key: string]: URI[] } = {},
  throttling: number = 0,
) => {
  const [resources, setResources] = useState<string[]>([])
  const [store, setStore] = useState(new n3.Store())
  const documents = useRdfDocuments(resources)

  const runStoreThrottled = useMemo(
    () => (throttling ? throttle(runStore, throttling) : runStore),
    [throttling],
  )

  const addResource = useCallback((g: string) => {
    setResources(resources =>
      resources.includes(g) ? resources : [...resources, g],
    )
  }, [])

  useEffect(() => {
    runStoreThrottled(documents, query, addResource, initial, setStore)
  }, [addResource, documents, initial, query, runStoreThrottled])

  return useMemo(
    () => [store, documents.some(d => d.isLoading)] as const,
    [documents, store],
  )
}
