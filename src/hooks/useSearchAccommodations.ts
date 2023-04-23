import { UseQueryResult } from '@tanstack/react-query'
import * as config from 'config'
import { parseRdf } from 'ldo'
import { AccommodationShapeType } from 'ldo/accommodation.shapeTypes'
import { HospexCommunityShapeType } from 'ldo/hospexCommunity.shapeTypes'
import { HospexGroupShapeType } from 'ldo/hospexGroup.shapeTypes'
import { HospexProfileShapeType } from 'ldo/hospexProfile.shapeTypes'
import { TypeRegistrationShapeType } from 'ldo/publicTypeIndex.shapeTypes'
import { SolidProfileShapeType } from 'ldo/solidProfile.shapeTypes'
import { isEqual, zip } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Accommodation, URI } from 'types'
import { hospex, sioc, solid } from 'utils/rdf-namespaces'
import { useSolidDocument, useSolidDocuments } from './useSolidDocument'

export const useSearchAccommodations = (communityId = config.communityId) => {
  // fetch community members
  const { data: communityDoc } = useSolidDocument(communityId)
  const groupIds = useCommunityGroups(communityId, communityDoc)
  const groupDocResults = useSolidDocuments(groupIds)
  const groupDocs = useResults(groupDocResults)
  const groupMembers = useGroupMembers(groupIds, groupDocs)

  // read profile and find type index of each member
  const profileDocResults = useSolidDocuments(groupMembers)
  const profileDocs = useResults(profileDocResults)
  const typeIndexes = useTypeIndexes(groupMembers, profileDocs)
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
  const accommodationUris = useParse(
    hospexDocuments,
    hospexDocs,
    getAccommodations,
    useCallback((a: URI[][]) => a.flat().filter(a => !!a), []),
  )
  // read accommodations
  const accommodationResults = useSolidDocuments(accommodationUris)
  const accommodationDocs = useResults(accommodationResults)
  const accommodations = useParse(
    accommodationUris,
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

/**
 * The name is overloaded: it's hook, and we also use results (i.e. get result data). We basically just map results to array of data, memoized
 * @param results
 * @returns
 */
const useResults = (results: UseQueryResult<string, unknown>[]) => {
  const docs = useMemo(() => results.map(result => result.data), [results])
  return docs
}

const getAccommodation = async (
  id: URI,
  doc: string = '',
): Promise<Accommodation | undefined> => {
  if (!doc) return undefined
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const accommodationData = ldoDataset
    .usingType(AccommodationShapeType)
    .fromSubject(id)

  const lat = Number(accommodationData.location?.lat)
  const long = Number(accommodationData.location?.long)

  if (isNaN(lat) || isNaN(long)) return undefined

  return {
    id: accommodationData['@id'] as string,
    description: accommodationData.comment?.[0] ?? '',
    location: { lat, long },
    offeredBy: accommodationData.offeredBy?.['@id'],
  }
}

const getAccommodations = async (id: URI, doc: string = ''): Promise<any> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const hospexData = ldoDataset
    .usingType(HospexProfileShapeType)
    .matchSubject(sioc.member_of)

  return hospexData[0]?.offers?.map(offer => offer['@id'])
}

const getHospexDocuments = async (id: URI, doc?: string): Promise<URI[]> => {
  const ldoDataset = await parseRdf(doc ?? '', { baseIRI: id })
  const typeRegistrations = ldoDataset
    .usingType(TypeRegistrationShapeType)
    .matchSubject(solid.forClass, hospex.PersonalHospexDocument)

  return typeRegistrations
    .map(reg => (reg.instance ?? []).map(i => i['@id']))
    .flat()
}

const useParse = <T, U>(
  ids: URI[],
  docs: (string | undefined)[],
  parse: (id: URI, doc: string | undefined) => Promise<T>,
  collect: (a: T[]) => U,
) => {
  const [results, setResults] = useState<U>(collect([]))

  useEffect(() => {
    ;(async () => {
      const res = await Promise.all(
        zip(ids, docs).map(
          async props => await parse(props[0] as URI, props[1]),
        ),
      )
      const newResults = collect(res)
      setResults(state => (isEqual(state, newResults) ? state : newResults))
    })()
  }, [collect, docs, ids, parse])

  return results
}

const useTypeIndexes = (ids: URI[], docs: (string | undefined)[]) => {
  const [results, setResults] = useState<URI[]>([])

  useEffect(() => {
    Promise.all(
      zip(ids, docs).map(props =>
        getPublicTypeIndex(props[0] as string, props[1]),
      ),
    ).then(res => {
      const newResults = res.flat()

      setResults(state => (isEqual(state, newResults) ? state : newResults))
    })
  }, [docs, ids])

  return results
}

const getPublicTypeIndex = async (
  id: URI,
  doc: string = '',
): Promise<URI[]> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const group = ldoDataset.usingType(SolidProfileShapeType).fromSubject(id)

  return group.publicTypeIndex ? group.publicTypeIndex.map(m => m['@id']) : []
}

const useCommunityGroups = (communityId: URI, communityDoc?: string): URI[] => {
  const [groupIds, setGroupIds] = useState<URI[]>([])

  useEffect(() => {
    ;(async () => {
      if (!communityDoc) return
      const ldoDataset = await parseRdf(communityDoc, { baseIRI: communityId })
      const community = ldoDataset
        .usingType(HospexCommunityShapeType)
        .fromSubject(communityId)

      const groups = community.hasUsergroup.map(({ '@id': uri }) => uri)

      setGroupIds(groups)
    })()
  }, [communityDoc, communityId])

  return groupIds
}

const useGroupMembers = (
  groupIds: URI[],
  groupDocs: (string | undefined)[],
) => {
  const [memberIds, setMemberIds] = useState<URI[]>([])

  useEffect(() => {
    Promise.all(
      zip(groupIds, groupDocs).map(props =>
        getMembers(props[0] as string, props[1]),
      ),
    ).then(members => {
      const newMemberIds = members.flat()

      setMemberIds(state =>
        isEqual(state, newMemberIds) ? state : newMemberIds,
      )
    })
  }, [groupDocs, groupIds])

  return memberIds
}

const getMembers = async (
  groupId: URI,
  groupDoc: string = '',
): Promise<URI[]> => {
  const ldoDataset = await parseRdf(groupDoc, { baseIRI: groupId })
  const group = ldoDataset.usingType(HospexGroupShapeType).fromSubject(groupId)

  return group.hasMember ? group.hasMember.map(m => m['@id']) : []
}
