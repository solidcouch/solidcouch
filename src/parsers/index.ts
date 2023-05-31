import { languagesOf, parseRdf } from 'ldo'
import { AccommodationShapeType } from 'ldo/accommodation.shapeTypes'
import { ActivityShapeType } from 'ldo/activity.shapeTypes'
import { ContainerShapeType } from 'ldo/container.shapeTypes'
import {
  HospexCommunityShapeType,
  HospexGroupShapeType,
} from 'ldo/hospexCommunity.shapeTypes'
import { HospexProfileShapeType } from 'ldo/hospexProfile.shapeTypes'
import {
  ChatMessageListShapeShapeType,
  ChatMessageShapeShapeType,
  ChatShapeShapeType,
} from 'ldo/longChat.shapeTypes'
import { TypeRegistrationShapeType } from 'ldo/publicTypeIndex.shapeTypes'
import { SolidProfileShapeType } from 'ldo/solidProfile.shapeTypes'
import { Accommodation, Message, URI } from 'types'
import { as, hospex, meeting, rdf, sioc, solid, wf } from 'utils/rdf-namespaces'

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

  const descriptionLanguages = languagesOf(accommodationData, 'description')

  return {
    id: accommodationData['@id'] as string,
    description: descriptionLanguages.en?.values().next().value ?? '',
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
 * Find long chats in type indexes
 */
export const getChatsFromTypeIndex = async (
  id: URI,
  doc?: string,
): Promise<URI[]> => {
  const ldoDataset = await parseRdf(doc ?? '', { baseIRI: id })
  const typeRegistrations = ldoDataset
    .usingType(TypeRegistrationShapeType)
    .matchSubject(solid.forClass, meeting.LongChat)

  return typeRegistrations
    .map(reg => (reg.instance ?? []).map(i => i['@id']))
    .flat()
}

export const getRelatedChats = async (
  id: URI,
  doc?: string,
): Promise<{ chat: URI; relatedChats: URI[]; participants: URI[] }> => {
  const ldoDataset = await parseRdf(doc ?? '', { baseIRI: id })
  const chat = ldoDataset.usingType(ChatShapeShapeType).fromSubject(id)

  const relatedChats =
    (chat.participation
      ?.map(p => p.references?.['@id'])
      .filter(a => a) as URI[]) ?? []

  const participants = (chat.participation ?? []).map(p => p.participant['@id'])

  return { chat: id, relatedChats, participants }
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

export const getPrivateTypeIndexes = async (
  id: URI,
  doc: string = '',
): Promise<URI[]> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const group = ldoDataset.usingType(SolidProfileShapeType).fromSubject(id)

  return group.privateTypeIndex ? group.privateTypeIndex.map(m => m['@id']) : []
}

export const getTypeIndexes = async (
  id: URI,
  doc: string = '',
): Promise<{ public: URI[]; private: URI[] }> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const group = ldoDataset.usingType(SolidProfileShapeType).fromSubject(id)

  return {
    public: group.publicTypeIndex
      ? group.publicTypeIndex.map(m => m['@id'])
      : [],
    private: group.privateTypeIndex
      ? group.privateTypeIndex.map(m => m['@id'])
      : [],
  }
}

export const getInbox = async (
  id: URI,
  doc: string = '',
): Promise<URI | undefined> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const group = ldoDataset.usingType(SolidProfileShapeType).fromSubject(id)

  return group.inbox?.['@id']
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
  return groups.filter(a => a) as URI[]
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

export const getContains = async (
  id: URI,
  doc: string = '',
): Promise<{ id: URI; contains: URI[] }> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const folder = ldoDataset.usingType(ContainerShapeType).fromSubject(id)
  return {
    id,
    contains: (folder.contains ?? [])
      .filter(f => f['@id'])
      .map(f => f['@id'] as URI),
  }
}

export const getMessagesFromDocument = async (
  id: URI,
  chatId: URI,
  doc: string = '',
): Promise<Message[]> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const chat = ldoDataset
    .usingType(ChatMessageListShapeShapeType)
    .fromSubject(chatId)
  return (chat.message ?? []).map(msg => ({
    id: msg['@id'] ?? '',
    message: msg.content,
    chat: chatId,
    createdAt: new Date(msg.created2).getTime(),
    from: msg.maker['@id'],
  }))
}

/**
 *
 * @param id - message id
 * @param doc - message document
 */
export const getMessage = async (
  id: URI,
  doc: string = '',
): Promise<Message | undefined> => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const message = ldoDataset
    .usingType(ChatMessageShapeShapeType)
    .fromSubject(id)
  const chat = ldoDataset
    .usingType(ChatMessageListShapeShapeType)
    .matchSubject(wf.message, id)
  if (!message.maker) return undefined
  return {
    id,
    message: message.content,
    from: message.maker['@id'],
    createdAt: new Date(message.created2).getTime(),
    chat: chat[0]['@id'] as URI,
  }
}

export const getMessageNotifications = async (id: URI, doc: string = '') => {
  const ldoDataset = await parseRdf(doc, { baseIRI: id })
  const activities = ldoDataset
    .usingType(ActivityShapeType)
    .matchSubject(rdf.type, as.Add)
    .filter(
      activity =>
        activity.context['@id'] === 'https://www.pod-chat.com/LongChatMessage',
    )
    .map(activity => ({
      id: activity['@id'] as URI,
      chat: activity.target['@id'],
      message: activity.object['@id'],
      actor: activity.actor['@id'],
    }))
  return activities
}
