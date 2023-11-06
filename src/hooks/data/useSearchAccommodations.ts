import { BlankNode, Literal, NamedNode, Quad, Variable } from '@rdfjs/types'
import * as config from 'config'
import { createLdoDataset } from 'ldo'
import { AccommodationShapeType } from 'ldo/app.shapeTypes'
import { HospexCommunityShapeType } from 'ldo/hospexCommunity.shapeTypes'
import { difference, differenceBy } from 'lodash'
import * as n3 from 'n3'
import { dct, rdfs, sioc, solid, vcard } from 'rdf-namespaces'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AccommodationExtended } from 'types'
import { removeHashFromURI } from 'utils/helpers'
import { hospex } from 'utils/rdf-namespaces'
import { useRdfDocuments } from './useRdfDocument'
import { useRdfQuery } from './useRdfQuery'
import { RdfQuery, useRdfQuery2 } from './useRdfQuery2'
import { myAccommodationsQuery } from './useReadAccommodations'

const searchAccommodationsQuery = [
  ['?communityId', (a: string) => a, '?community', HospexCommunityShapeType],
  ['?community', 'hasUsergroup', '?group'],
  ['?group', 'hasMember', '?personId'],
  ...myAccommodationsQuery,
] as const

/**
 * Fetch hosting offers from all community members
 * TODO there are security checks missing
 * we should make sure that accommodation is offered by the user who offers it (check both directions of the relationship)
 */

const findObjects = (
  store: n3.Store,
  subject: n3.NamedNode,
  predicate: n3.NamedNode,
) => {
  const matches = store.match(subject, predicate)

  const objects = []
  for (const quad of matches) {
    objects.push(quad.object)
  }
  return objects
}

const findQuads = (
  store: n3.Store,
  subject: n3.NamedNode,
  predicate: n3.NamedNode,
  object?: n3.NamedNode | null,
  graph?: n3.NamedNode | null,
) => {
  const matches = store.match(subject, predicate, object, graph)

  return [...matches]
}
// fetch documents => parse data => find more documents to fetch => fetch more documents
export const useSearchAccommodations2 = (communityId = config.communityId) => {
  const [resources, setResources] = useState([communityId])
  const [store, setStore] = useState(new n3.Store())

  const addResource = useCallback(
    (g: NamedNode | Quad | BlankNode | Literal | Variable) => {
      if (g.termType === 'NamedNode')
        setResources(resources =>
          resources.includes(removeHashFromURI(g.value))
            ? resources
            : [...resources, removeHashFromURI(g.value)],
        )
    },
    [],
  )

  const documents = useRdfDocuments(resources)

  useEffect(() => {
    const start = Date.now()
    const store = new n3.Store()
    documents.forEach(({ data }) => data && store.addQuads(data.data))

    const groups = findObjects(
      store,
      new n3.NamedNode(communityId),
      new n3.NamedNode(sioc.has_usergroup),
    )

    groups.forEach(addResource)

    const people = groups
      .map(g =>
        findObjects(
          store,
          g as n3.NamedNode,
          new n3.NamedNode(vcard.hasMember),
        ),
      )
      .flat()

    people.forEach(addResource)

    const extendedDocuments = people
      .map(p =>
        findObjects(store, p as n3.NamedNode, new n3.NamedNode(rdfs.seeAlso)),
      )
      .flat()

    extendedDocuments.forEach(addResource)

    const publicTypeIndexes = people
      .map(p =>
        findObjects(
          store,
          p as n3.NamedNode,
          new n3.NamedNode(solid.publicTypeIndex),
        ),
      )
      .flat()

    publicTypeIndexes.forEach(addResource)

    const typeRegistrations = publicTypeIndexes
      .map(pti =>
        findObjects(
          store,
          pti as n3.NamedNode,
          new n3.NamedNode(dct.references),
        ),
      )
      .flat()

    const typeRegistrationsForHospex = typeRegistrations
      .map(tr =>
        findQuads(
          store,
          tr as n3.NamedNode,
          new n3.NamedNode(solid.forClass),
          new n3.NamedNode(hospex.PersonalHospexDocument),
        ),
      )
      .flat()
      .map(q => q.subject)

    const hospexDocuments = typeRegistrationsForHospex
      .map(tr =>
        findObjects(
          store,
          tr as n3.NamedNode,
          new n3.NamedNode(solid.instance),
        ),
      )
      .flat()

    hospexDocuments.forEach(addResource)

    // now find only hospex documents that are made for this particular community

    const hospexDocumentsForCommunity = people
      .map(p =>
        findQuads(
          store,
          p as n3.NamedNode,
          new n3.NamedNode(sioc.member_of),
          new n3.NamedNode(communityId),
        ),
      )
      .flat()
      .map(q => q.graph)

    const otherHospexDocuments = differenceBy(
      hospexDocuments,
      hospexDocumentsForCommunity,
      'value',
    )

    otherHospexDocuments.forEach(hd =>
      store.removeMatches(null, null, null, hd as n3.NamedNode),
    )

    const offers = people
      .map(p =>
        findObjects(store, p as n3.NamedNode, new n3.NamedNode(hospex.offers)),
      )
      .flat()

    offers.forEach(addResource)

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

    console.log(start, Date.now() - start)
  }, [addResource, communityId, documents])

  return useMemo(() => {
    const dataset = createLdoDataset([...store])
    const accommodations = dataset
      .usingType(AccommodationShapeType)
      .matchObject(null, hospex.offers)
      .filter(a => a.location)
      .map(a => ({
        id: a['@id'] ?? '',
        description: a.description?.[0] ?? '',
        // TODO this is an inconsistency fix
        // https://github.com/o-development/ldo/issues/22#issuecomment-1590228592
        location: {
          lat: [a.location.lat].flat()[0],
          long: [a.location.long].flat()[0],
        },
        offeredBy: {
          id: a.offeredBy?.['@id'] ?? '',
          name: a.offeredBy?.name ?? '',
        },
      }))

    return [accommodations]
  }, [store])
}

export const useSearchAccommodations = (communityId = config.communityId) => {
  const [results, queryStatus] = useRdfQuery(searchAccommodationsQuery, {
    communityId,
  })
  const accommodations: AccommodationExtended[] = useMemo(
    () =>
      results.accommodation
        .filter(a => a.location)
        .map(a => ({
          id: a['@id'] ?? '',
          description: a.description?.[0] ?? '',
          // TODO this is an inconsistency fix
          // https://github.com/o-development/ldo/issues/22#issuecomment-1590228592
          location: {
            lat: [a.location.lat].flat()[0],
            long: [a.location.long].flat()[0],
          },
          offeredBy: {
            id: a.offeredBy?.['@id'] ?? '',
            name: a.offeredBy?.name ?? '',
          },
        })),
    [results.accommodation],
  )
  return useMemo(
    () => [accommodations, queryStatus] as const,
    [accommodations, queryStatus],
  )
}

const searchAccommodationsQuery2: RdfQuery = [
  {
    type: 'match',
    subject: '?community',
    predicate: sioc.has_usergroup,
    pick: 'object',
    target: '?group',
  },
  {
    type: 'match',
    subject: '?group',
    predicate: vcard.hasMember,
    pick: 'object',
    target: '?person',
  },
  {
    type: 'match',
    subject: '?person',
    predicate: solid.publicTypeIndex,
    pick: 'object',
    target: '?publicTypeIndex',
  },
  {
    type: 'match',
    subject: '?publicTypeIndex',
    predicate: dct.references,
    pick: 'object',
    target: '?typeRegistration',
  },
  {
    type: 'match',
    subject: '?typeRegistration',
    predicate: solid.forClass,
    object: hospex.PersonalHospexDocument,
    pick: 'subject',
    target: '?typeRegistrationForHospex',
  },
  {
    type: 'match',
    subject: '?typeRegistrationForHospex',
    predicate: solid.instance,
    pick: 'object',
    target: `?hospexDocument`,
  },
  { type: 'add resources', variable: '?hospexDocument' },
  {
    type: 'match',
    subject: '?person',
    predicate: sioc.member_of,
    object: '?community',
    pick: 'graph',
    target: '?hospexDocumentForCommunity',
  },
  // remove all hospex documents that don't belong to this community
  (store, variables) => {
    differenceBy(
      variables.hospexDocument,
      variables.hospexDocumentForCommunity,
      'value',
    ).forEach(hd => store.removeMatches(null, null, null, hd as n3.NamedNode))
  },
  {
    type: 'match',
    subject: '?person',
    predicate: hospex.offers,
    pick: 'object',
    target: '?offer',
  },
  { type: 'add resources', variable: '?offer' },
]

export const useSearchAccommodations3 = (communityId = config.communityId) => {
  const initial = useMemo(() => ({ community: [communityId] }), [communityId])
  const [store, isLoading] = useRdfQuery2(
    searchAccommodationsQuery2,
    initial,
    1000,
  )

  return useMemo(() => {
    const dataset = createLdoDataset([...store])
    const accommodations = dataset
      .usingType(AccommodationShapeType)
      .matchObject(null, hospex.offers)
      .filter(a => a.location)
      .map(a => ({
        id: a['@id'] ?? '',
        description: a.description?.[0] ?? '',
        // TODO this is an inconsistency fix
        // https://github.com/o-development/ldo/issues/22#issuecomment-1590228592
        location: {
          lat: [a.location.lat].flat()[0],
          long: [a.location.long].flat()[0],
        },
        offeredBy: {
          id: a.offeredBy?.['@id'] ?? '',
          name: a.offeredBy?.name ?? '',
        },
      }))

    return [accommodations, isLoading] as const
  }, [isLoading, store])
}
