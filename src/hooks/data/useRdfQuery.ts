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
 *
 */

import { Quad } from '@rdfjs/types'
import { useQueries, useQuery } from '@tanstack/react-query'
import { createLdoDataset, ShapeType } from 'ldo'
import { ContainerShapeType, SolidProfileShapeType } from 'ldo/app.shapeTypes'
import { ChatShape, SolidProfile } from 'ldo/app.typings'
import { LdoBase } from 'ldo/dist/util'
import { difference, uniq } from 'lodash'
import { DataFactory, Parser, ParserOptions } from 'n3'
import { useEffect, useMemo, useState } from 'react'
import { Message, URI } from 'types'
import type { Required } from 'utility-types'
import { fullFetch, getContainer, removeHashFromURI } from 'utils/helpers'

const messagesQuery: Query<{ userId: URI; me: URI }> = [
  ['?me', (a: string) => a, '?me', SolidProfileShapeType],
  ['?me', 'seeAlso', '?profileDocument'],
  ['?profileDocument', '', ''],
  ['?me', 'privateTypeIndex', '?privateTypeIndex'],
  ['?privateTypeIndex', 'references', '?typeRegistration'],
  ['?typeRegistration', 'forClass', 'LongChat'],
  ['?typeRegistration', 'instance', '?chat'],
  ['?chat', 'participation', '?participation'],
  [
    '?chat',
    (ldo: ChatShape, params: { userId: URI }) =>
      ldo.participation?.length === 2 &&
      ldo.participation.some(p => p.participant['@id'] === params.userId),
  ],
  ['?participation', 'references', '?otherChat'],
  ['?chat', 'message', '?message'],
  ['?otherChat', 'message', '?message'],
  ['?chat', getContainer, '?chatContainer', ContainerShapeType],
  ['?otherChat', getContainer, '?chatContainer', ContainerShapeType],
  ['?chatContainer', 'contains', '?year'],
  ['?year', 'contains', '?month'],
  ['?month', 'contains', '?day'],
  ['?day', 'contains', '?messagesDoc'],
  ['?messagesDoc', '', ''],
]

export const useMessages = ({ me, userId }: { me: URI; userId: URI }) => {
  const [results] = useRdfQuery(messagesQuery, { me, userId })
  const ldoMe = results.me as SolidProfile[]
  const messages = ldoMe
    ?.flatMap(ldo =>
      ldo.privateTypeIndex?.flatMap(pti =>
        pti.references?.flatMap(reference =>
          reference.instance?.flatMap(chat =>
            (chat as ChatShape).message?.flatMap(message =>
              message
                ? ({
                    id: message['@id'],
                    message: message.content,
                    createdAt: new Date(message.created2).getTime(),
                    from: message.maker['@id'],
                    chat: chat['@id'],
                    test: (chat as ChatShape).participation?.map(
                      p => p.participant['@id'],
                    ),
                  } as Message)
                : [],
            ),
          ),
        ),
      ),
    )
    .filter(a => a) as Message[]
  const otherMessages =
    (ldoMe
      ?.flatMap(ldo =>
        ldo.privateTypeIndex?.flatMap(pti =>
          pti.references?.flatMap(reference =>
            reference.instance?.flatMap(chat =>
              (chat as ChatShape).participation?.flatMap(participation =>
                participation.references?.[0]?.message?.flatMap(message =>
                  message
                    ? ({
                        id: message['@id'],
                        message: message.content,
                        createdAt: new Date(message.created2).getTime(),
                        from: message.maker['@id'],
                        chat: chat['@id'],
                        test: (chat as ChatShape).participation?.map(
                          p => p.participant['@id'],
                        ),
                      } as Message)
                    : [],
                ),
              ),
            ),
          ),
        ),
      )
      .filter(a => a) as Message[]) ?? []

  return [
    messages
      .concat(otherMessages)
      .sort((a, b) => (a?.createdAt ?? 0) - (b?.createdAt ?? 0)),
  ]
}

type Query<Params extends { [key: string]: string | URI }> = (
  | [string, string, string]
  | [string, (uri: URI) => URI, string, ShapeType<any>]
  | [string, (ldo: any, params: Params) => boolean]
)[]

export const useRdfQuery = <Params extends { [key: string]: URI | string }>(
  query: Query<Params>,
  params: Params,
) => {
  const [dataset] = useRdfQueryData(query, params)

  return [useRdfQueryResults(query, params, dataset)]
}

const useRdfQueryResults = <Params extends { [key: string]: URI | string }>(
  query: Query<Params>,
  params: Params,
  dataset: Quad[],
) => {
  const results = useMemo(() => {
    const ldoBasePaths = query.filter(path => path.length === 4) as [
      string,
      (uri: URI) => URI,
      string,
      ShapeType<any>,
    ][]

    const partialResults = getPartialResults(query, dataset, params)
    const baseResults: { [name: string]: unknown[] } = {}
    for (const [, , variable, shape] of ldoBasePaths) {
      const name = variable.slice(1)
      baseResults[name] = partialResults[name] as IsShapeOf<typeof shape>
    }
    return baseResults
  }, [dataset, params, query])
  return results
}

type IsShapeOf<Shape> = Shape extends ShapeType<infer T> ? T : never

export const useRdfQueryData = <Params extends { [key: string]: URI | string }>(
  query: Query<Params>,
  params: Params,
) => {
  const [resources, setResources] = useState<URI[]>([])

  // fetch resources
  const results = useRdfDocuments(resources)

  // collect datasets
  const dataset = useMemo(() => {
    return results.flatMap(result => result.data ?? [])
  }, [results])

  useEffect(() => {
    // update resources that we don't have, yet
    // const ldoDataset = createLdoDataset(dataset)
    // const ldo = ldoDataset
    //   .usingType(shape)
    //   .fromSubject(params[query[0][0].slice(1)])

    // const newResources: Set<URI> = new Set()
    // newResources.add(removeHashFromURI(ldo['@id']))
    // query.forEach((q, i, query) => {
    //   const path = getPath(query, i)
    //   // we want to ignore last path element, because no further query is expected for it
    //   let nextLdo = (Array.isArray(ldo) ? ldo : ldo ? [ldo] : []) as LdoShape[]

    //   path.slice(0, -1).forEach(p => {
    //     nextLdo = nextLdo.flatMap(nl => {
    //       if (typeof p[1] === 'string') {
    //         return nl?.[p[1]] ?? []
    //       } else {
    //         const shape = p[3] as ShapeType<any>
    //         if (nl?.['@id']) {
    //           const nextUri = (p[1] as (uri: URI) => URI)(nl['@id'])
    //           const ldo = ldoDataset.usingType(shape).fromSubject(nextUri)
    //           return ldo
    //         } else return []
    //       }
    //     })
    //   })

    //   if (Array.isArray(nextLdo)) {
    //     nextLdo.forEach(nl => {
    //       const uri = nl?.['@id']
    //       if (uri) {
    //         newResources.add(removeHashFromURI(uri))
    //       }
    //     })
    //   } else {
    //     const uri = nextLdo?.['@id']
    //     if (uri) {
    //       newResources.add(removeHashFromURI(uri))
    //     }
    //   }
    // })
    const partialResults = getPartialResults(query, dataset, params)
    const newResources = getNecessaryDocs(query, partialResults)
    setResources(oldResources => {
      const diff = difference(Array.from(newResources), oldResources)
      return diff.length > 0 ? Array.from(newResources) : oldResources
    })
  }, [dataset, params, query])

  // return the dataset
  return [dataset]
}

const getPartialResults = <Params extends { [key: string]: URI | string }>(
  query: Query<Params>,
  dataset: Quad[],
  params: Params,
): { [key: string]: LdoBase[] } => {
  const ldoDataset = createLdoDataset(dataset)
  const partialResults: { [key: string]: LdoBase[] } = {}
  for (const path of query) {
    // when it's a query with ldo type
    const [from, , to] = path
    const fromName = from.slice(1)
    const toName = to?.slice(1) as string

    const filters = (
      query.filter(
        path =>
          path.length === 3 &&
          path[0] === from &&
          (!path[2].startsWith('?') || path[2].slice(1) in params),
      ) as [string, string, string][]
    ).map(
      ([s, p, o]) =>
        [s, p, o.startsWith('?') ? params[o.slice(1)] : o] as [
          string,
          string,
          string,
        ],
    )
    const filters2 = query.filter(
      path => path.length === 2 && path[0] === from,
    ) as [string, (ldo: any, params: Params) => boolean][]

    const fromLdos = uniq(
      (partialResults[fromName] ?? []).filter(
        ldo =>
          ldo &&
          filters.every(filter => filterLdo(ldo, filter)) &&
          filters2.every(filter => filter[1](ldo, params)),
      ),
    )

    if (path.length === 4) {
      const [, fn, , shapeType] = path

      // subject is either from params, or from previous object
      const paramSubject = params[fromName]
      const ldoSubject = fromLdos?.map(r => r['@id']).filter(a => a) as URI[]
      const subjects = (
        paramSubject ? [paramSubject] : ldoSubject ? ldoSubject : []
      ).map(from => fn(from))

      const ldos = subjects.map(subject =>
        ldoDataset.usingType(shapeType).fromSubject(subject),
      )
      partialResults[toName] = uniq((partialResults[toName] ?? []).concat(ldos))
    } else if (path.length === 3) {
      const [, predicate, object] = path

      // if object starts with ? try to find it in params
      const objectVarName = object.startsWith('?') ? object.slice(1) : undefined
      const objectValue = objectVarName ? params[objectVarName] : undefined

      if (objectValue) {
        // partialResults[subjectVarName] = uniq(
        //   partialResults[subjectVarName].filter(ldo => {
        //     if (ldo[predicate]['@id'] === objectValue) return true
        //     if (
        //       Array.isArray(ldo[predicate]) &&
        //       ldo[predicate].some((obj: any) => obj['@id'] === objectValue)
        //     )
        //       return true
        //     return false
        //   }),
        // )
      } else if (objectVarName) {
        // filter the ldo with available filters, and get the object
        // get filters for this subject
        partialResults[objectVarName] = fromLdos.flatMap(ldo => ldo[predicate])
      }

      // if we don't find it in params, make a new object from the old one

      // otherwise we filter it
    }
  }
  return partialResults
}

const filterLdo = (ldo: LdoBase, filter: [string, string, string]): boolean => {
  const objs: LdoBase[] = Array.isArray(ldo[filter[1]])
    ? ldo[filter[1]]
    : ldo[filter[1]]
    ? [ldo[filter[1]]]
    : []
  return objs.some(obj => obj['@id'] === filter[2])
}

/**
 * Get documents that we need to proceed
 */
const getNecessaryDocs = <Params extends { [key: string]: string }>(
  query: Query<Params>,
  partialResults: { [key: string]: LdoBase[] },
) => {
  // including "?"
  const necessaryVariables = uniq(query.map(path => path[0]))

  const uris = (
    necessaryVariables
      .flatMap(name => {
        const ldos = partialResults[name.slice(1)]
        const raw = ldos
        return Array.isArray(raw)
          ? raw.map(r => r?.['@id'] ?? [])
          : raw?.['@id'] ?? []
      })
      .flat(5)
      .filter(a => a) as URI[]
  ).map(a => removeHashFromURI(a))
  return uniq(uris)
}

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
          queryKey: ['solidDocument', doc],
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
    return parseRdf(data, { baseIRI: uri })
  } else throw new Error(`Fetching ${uri} not successful`)
}

const parseRdf = (
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
