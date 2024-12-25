import { hospex } from '@/utils/rdf-namespaces.ts'
import type { RdfQuery } from '@ldhop/core'
import { readCommunityMembersQuery } from './community.ts'
import { hospexDocumentQuery } from './hospex.ts'

export const readPersonAccommodationsQuery: RdfQuery = [
  ...hospexDocumentQuery,
  {
    type: 'match',
    subject: '?person',
    predicate: hospex.offers,
    graph: '?hospexDocumentForCommunity',
    pick: 'object',
    target: '?offer',
  },
  { type: 'add resources', variable: '?offer' },
]

/**
 * Fetch hosting offers from all community members
 * TODO there are security checks missing
 * we should make sure that accommodation is offered by the user who offers it (check both directions of the relationship)
 */
export const searchAccommodationsQuery: RdfQuery = [
  ...readCommunityMembersQuery,
  ...readPersonAccommodationsQuery,
]

export const accommodationQuery: RdfQuery = [
  {
    type: 'match',
    subject: '?offer',
    predicate: hospex.offeredBy,
    pick: 'object',
    target: '?person',
  },
]
