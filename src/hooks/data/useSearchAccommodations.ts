import * as config from 'config'
import { HospexCommunityShapeType } from 'ldo/hospexCommunity.shapeTypes'
import { useMemo } from 'react'
import { AccommodationExtended } from 'types'
import { useRdfQuery } from './useRdfQuery'
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
