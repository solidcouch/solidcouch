import { useParse, useResults } from 'hooks/queryHelpers'
import { useSolidDocuments } from 'hooks/useSolidDocument'
import {
  getAccommodation,
  getAccommodations,
  getHospexDocuments,
  getPublicTypeIndexes,
} from 'parsers'
import { useCallback, useMemo } from 'react'
import { Accommodation, URI } from 'types'

/**
 * Read accommodations of a person
 */
export const useReadAccommodations = (personId: URI): Accommodation[] => {
  // read profile and find type index of each member
  const personIdParam = useMemo(() => [personId], [personId])
  const profileDocResults = useSolidDocuments(personIdParam)
  const profileDocs = useResults(profileDocResults)
  const typeIndexes = useParse(
    personIdParam,
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

  return accommodations
}
