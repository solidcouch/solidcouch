import { HospexCommunityShapeType } from 'ldo/hospexCommunity.shapeTypes'
import { useMemo } from 'react'
import { URI } from 'types'
import { useRdfQuery } from './useRdfQuery'

const membershipQuery = [
  ['?community', (c: URI) => c, '?com', HospexCommunityShapeType],
  ['?com', 'hasUsergroup', '?group'],
  ['?group'],
] as const

export const useIsMember = (userId: URI, communityId: URI) => {
  const [results] = useRdfQuery(membershipQuery, { community: communityId })
  if (results.group.length === 0) return undefined
  const isMember = results.group.some(group =>
    group.hasMember?.some(member => member['@id'] === userId),
  )
  return isMember
}

export const useReadCommunity = (communityId: URI) => {
  const [results] = useRdfQuery(membershipQuery, { community: communityId })
  return useMemo(
    () => ({
      community: communityId,
      groups: results.group.flatMap(g => g['@id'] ?? []),
    }),
    [communityId, results.group],
  )
}
