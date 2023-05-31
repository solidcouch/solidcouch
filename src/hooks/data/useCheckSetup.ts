import {
  HospexProfileShapeType,
  SolidProfileShapeType,
} from 'ldo/app.shapeTypes'
import { HospexProfile } from 'ldo/app.typings'
import { HospexCommunityShapeType } from 'ldo/hospexCommunity.shapeTypes'
import { useMemo } from 'react'
import { URI } from 'types'
import { hospex } from 'utils/rdf-namespaces'
import { useRdfQuery } from './useRdfQuery'

/**
 * Check that
 * public type index exists
 * private type index exists
 * personal hospex document exists
 * community is joined
 */
export const useCheckSetup = (userId: URI, communityId: URI) => {
  const isMember = useIsMember(userId, communityId)
  const hospexDocumentSetup = useHospexDocumentSetup(userId, communityId)
  return useMemo(
    () => ({ isMember, ...hospexDocumentSetup } as const),
    [hospexDocumentSetup, isMember],
  )
}

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

const hospexDocumentQuery = [
  ['?userId', (a: string) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
  ['?profile', 'privateTypeIndex', '?privateTypeIndex'],
  ['?privateTypeIndex'],
  ['?profile', 'publicTypeIndex', '?publicTypeIndex'],
  ['?publicTypeIndex', 'references', '?typeRegistration'],
  ['?typeRegistration', 'forClass', hospex.PersonalHospexDocument],
  ['?typeRegistration', 'instance', '?hospexDocument'],
  ['?hospexDocument'],
  ['?profile', (a: string) => a, '?hospexProfile', HospexProfileShapeType],
  [
    '?hospexProfile',
    (profile: HospexProfile, params: { communityId: URI }) =>
      profile.memberOf?.['@id'] === params.communityId,
  ],
  ['?hospexProfile'],
] as const
export const useHospexDocumentSetup = (userId: URI, communityId: URI) => {
  const [results, queryStatus] = useRdfQuery(hospexDocumentQuery, {
    userId,
    communityId,
  })
  const personalHospexDocuments = results.typeRegistration.flatMap(
    tr => tr.instance?.flatMap(i => i['@id'] ?? []) ?? [],
  )
  const isHospexProfile =
    results.hospexProfile.length > 0
      ? true
      : queryStatus.isInitialLoading
      ? undefined
      : false
  const isPublicTypeIndex =
    results.publicTypeIndex.length > 0
      ? true
      : queryStatus.isInitialLoading
      ? undefined
      : false
  const isPrivateTypeIndex =
    results.privateTypeIndex.length > 0
      ? true
      : queryStatus.isInitialLoading
      ? undefined
      : false
  return {
    isHospexProfile,
    isPublicTypeIndex,
    isPrivateTypeIndex,
    personalHospexDocuments,
  } as const
}
