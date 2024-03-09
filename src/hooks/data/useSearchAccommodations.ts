import { createLdoDataset } from '@ldo/ldo'
import * as config from 'config'
import { AccommodationShapeType } from 'ldo/app.shapeTypes'
import { differenceBy } from 'lodash'
import * as n3 from 'n3'
import { dct, sioc, solid, vcard } from 'rdf-namespaces'
import { useMemo } from 'react'
import { hospex } from 'utils/rdf-namespaces'
import { RdfQuery, useRdfQuery } from './useRdfQuery2'

/**
 * Fetch hosting offers from all community members
 * TODO there are security checks missing
 * we should make sure that accommodation is offered by the user who offers it (check both directions of the relationship)
 */

const searchAccommodationsQuery: RdfQuery = [
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

export const useSearchAccommodations = (communityId = config.communityId) => {
  const initial = useMemo(() => ({ community: [communityId] }), [communityId])
  const [store, isLoading] = useRdfQuery(
    searchAccommodationsQuery,
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
