import { parseRdf } from 'ldo'
import { AccommodationShapeType } from 'ldo/accommodation.shapeTypes'
import { HospexCommunityShapeType } from 'ldo/hospexCommunity.shapeTypes'
import { HospexGroupShapeType } from 'ldo/hospexGroup.shapeTypes'
import { HospexProfileShapeType } from 'ldo/hospexProfile.shapeTypes'
import { TypeRegistrationShapeType } from 'ldo/publicTypeIndex.shapeTypes'
import { SolidProfileShapeType } from 'ldo/solidProfile.shapeTypes'
import { Accommodation, URI } from 'types'
import { hospex, sioc, solid } from 'utils/rdf-namespaces'

/**
 * Read accommodation from accommodation document
 * @param id
 * @param doc
 * @returns
 */
export const getAccommodation = async (
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

/**
 * Read accommodation URIs from personal hospex profile
 * @param id
 * @param doc
 * @returns
 */
export const getAccommodations = async (
  id: URI,
  doc: string = '',
): Promise<any> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const hospexData = ldoDataset
    .usingType(HospexProfileShapeType)
    .matchSubject(sioc.member_of)

  return hospexData[0]?.offers?.map(offer => offer['@id'])
}

/**
 * Find hospex documents in type index
 * @param id
 * @param doc
 * @returns
 */
export const getHospexDocuments = async (
  id: URI,
  doc?: string,
): Promise<URI[]> => {
  const ldoDataset = await parseRdf(doc ?? '', { baseIRI: id })
  const typeRegistrations = ldoDataset
    .usingType(TypeRegistrationShapeType)
    .matchSubject(solid.forClass, hospex.PersonalHospexDocument)

  return typeRegistrations
    .map(reg => (reg.instance ?? []).map(i => i['@id']))
    .flat()
}

/**
 * Find uri of a public type index in a person's profile document
 * @param id - person's webId, and baseUri of the document
 * TODO id needs better specification, or this method needs improvement
 * Because often baseIRI of the document, and webId aren't the same.
 * @param doc string - fetched RDF document (turtle format is good)
 * @returns Array of type index URIs
 */
export const getPublicTypeIndexes = async (
  id: URI,
  doc: string = '',
): Promise<URI[]> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const group = ldoDataset.usingType(SolidProfileShapeType).fromSubject(id)

  return group.publicTypeIndex ? group.publicTypeIndex.map(m => m['@id']) : []
}

/**
 * Read lists of usergroups of a community
 * @param communityId
 * @param communityDoc
 * @returns
 */
export const getCommunityGroups = async (
  communityId: URI,
  communityDoc: string = '',
): Promise<URI[]> => {
  if (!communityDoc) return []
  const ldoDataset = await parseRdf(communityDoc, { baseIRI: communityId })
  const community = ldoDataset
    .usingType(HospexCommunityShapeType)
    .fromSubject(communityId)

  const groups = community.hasUsergroup.map(({ '@id': uri }) => uri)
  return groups
}

/**
 * Read lists of members from vcard:Group document
 * @param groupId
 * @param groupDoc
 * @returns
 */
export const getMembers = async (
  groupId: URI,
  groupDoc: string = '',
): Promise<URI[]> => {
  const ldoDataset = await parseRdf(groupDoc, { baseIRI: groupId })
  const group = ldoDataset.usingType(HospexGroupShapeType).fromSubject(groupId)

  return group.hasMember ? group.hasMember.map(m => m['@id']) : []
}
