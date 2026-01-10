import { hospex } from '@/utils/rdf-namespaces'
import type { LdhopQuery } from '@ldhop/core'
import { readCommunityMembersQuery } from './community'
import { hospexDocumentQuery } from './hospex'

export const readPersonAccommodationsQuery = hospexDocumentQuery
  .match('?person', hospex.offers, null, '?hospexDocumentForCommunity')
  .o('?offer')
  .add()

/**
 * Fetch hosting offers from all community members
 * TODO there are security checks missing
 * we should make sure that accommodation is offered by the user who offers it (check both directions of the relationship)
 */
export const searchAccommodationsQuery = readCommunityMembersQuery.concat(
  readPersonAccommodationsQuery,
)

export const accommodationQuery: LdhopQuery<'?offer' | '?person'> = [
  {
    type: 'match',
    subject: '?offer',
    predicate: hospex.offeredBy,
    pick: 'object',
    target: '?person',
  },
]
