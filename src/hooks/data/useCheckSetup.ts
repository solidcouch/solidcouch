import {
  HospexProfileShapeType,
  SolidProfileShapeType,
} from 'ldo/app.shapeTypes'
import { HospexProfile } from 'ldo/app.typings'
import { useMemo } from 'react'
import { URI } from 'types'
import { hospex } from 'utils/rdf-namespaces'
import { useIsMember } from './useCommunity'
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
  const publicTypeIndexes = results.publicTypeIndex.flatMap(
    index => index['@id'] ?? [],
  )
  const privateTypeIndexes = results.privateTypeIndex.flatMap(
    index => index['@id'] ?? [],
  )
  const inboxes = results.profile.flatMap(p => p.inbox?.['@id'] ?? [])

  const isHospexProfile =
    results.hospexProfile.length > 0
      ? true
      : queryStatus.isInitialLoading
      ? undefined
      : false
  const isPublicTypeIndex =
    publicTypeIndexes.length > 0
      ? true
      : queryStatus.isInitialLoading
      ? undefined
      : false
  const isPrivateTypeIndex =
    privateTypeIndexes.length > 0
      ? true
      : queryStatus.isInitialLoading
      ? undefined
      : false
  const isInbox =
    inboxes.length > 0 ? true : queryStatus.isInitialLoading ? undefined : false
  return {
    isHospexProfile,
    isPublicTypeIndex,
    isPrivateTypeIndex,
    isInbox,
    personalHospexDocuments,
    publicTypeIndexes,
    privateTypeIndexes,
    inboxes,
  } as const
}
