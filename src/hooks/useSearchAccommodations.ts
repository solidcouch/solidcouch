import * as config from 'config'
import {
  getAccommodation,
  getAccommodations,
  getCommunityGroups,
  getHospexDocuments,
  getMembers,
  getPublicTypeIndexes,
} from 'parsers'
import { useCallback, useMemo } from 'react'
import { Accommodation, URI } from 'types'
import { useParse, useParseOne, useResults } from './queryHelpers'
import { useSolidDocument, useSolidDocuments } from './useSolidDocument'

const emptyArray: URI[] = []

/**
 * Fetch hosting offers from all community members
 * TODO there are security checks missing
 * we should double-check that users offer accommodations for particular community
 * and we should make sure that accommodation is offered by the user who offers it (check both directions of the relationship)
 */

export const useSearchAccommodations = (communityId = config.communityId) => {
  // fetch community members
  const { data: communityDoc } = useSolidDocument(communityId)
  const groupIds =
    useParseOne(communityId, communityDoc, getCommunityGroups) ?? emptyArray

  const groupDocResults = useSolidDocuments(groupIds)
  const groupDocs = useResults(groupDocResults)
  const groupMembers = useParse(
    groupIds,
    groupDocs,
    getMembers,
    useCallback((a: URI[][]) => a.flat(), []),
  )

  // read profile and find type index of each member
  const profileDocResults = useSolidDocuments(groupMembers)
  const profileDocs = useResults(profileDocResults)
  const typeIndexes = useParse(
    groupMembers,
    profileDocs,
    getPublicTypeIndexes,
    useCallback((a: URI[][]) => a.flat(), []),
  )

  // find relevant hospex documents in type indexes
  const typeIndexResults = useSolidDocuments(typeIndexes)
  const typeIndexDocs = useResults(typeIndexResults)
  const hospexDocuments = useParse(
    typeIndexes,
    typeIndexDocs,
    getHospexDocuments,
    useCallback((a: URI[][]) => a.flat(), []),
  )
  // find accommodations in hospex documents
  const hospexDocumentResults = useSolidDocuments(hospexDocuments)
  const hospexDocs = useResults(hospexDocumentResults)
  const accommodationIds = useParse(
    hospexDocuments,
    hospexDocs,
    getAccommodations,
    useCallback((a: URI[][]) => a.flat().filter(a => !!a), []),
  )
  // read accommodations
  const accommodationResults = useSolidDocuments(accommodationIds)
  const accommodationDocs = useResults(accommodationResults)
  const accommodations = useParse(
    accommodationIds,
    accommodationDocs,
    getAccommodation,
    useCallback(
      (a: (Accommodation | undefined)[]) =>
        a.filter(a => !!a) as Accommodation[],
      [],
    ),
  )

  const foundAccommodations: Accommodation[] = useMemo(
    () => accommodations.filter(a => !!a),
    [accommodations],
  )
  return foundAccommodations
}
