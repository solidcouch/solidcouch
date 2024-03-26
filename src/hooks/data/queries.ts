import type { Match, RdfQuery } from '@ldhop/core'
import { dct, foaf, ldp, rdf, sioc, solid, vcard } from 'rdf-namespaces'
import { getContainer } from 'utils/helpers'
import { as, hospex, meeting, rdfs, space, wf } from 'utils/rdf-namespaces'

const personInbox: Match = {
  type: 'match',
  subject: '?person',
  predicate: ldp.inbox,
  pick: 'object',
  target: '?inbox',
}

export const profileDocuments: RdfQuery = [
  {
    type: 'match',
    subject: '?person',
    predicate: rdfs.seeAlso, // TODO also include foaf.isPrimaryTopicOf
    pick: 'object',
    target: '?profileDocument',
  },
  // fetch the profile documents
  { type: 'add resources', variable: '?profileDocument' },
]

const publicWebIdProfileQuery: RdfQuery = [
  ...profileDocuments,
  // find public type index
  {
    type: 'match',
    subject: '?person',
    predicate: solid.publicTypeIndex,
    pick: 'object',
    target: '?publicTypeIndex',
  },
]

// find person and their profile documents
// https://solid.github.io/webid-profile/#discovery
export const webIdProfileQuery: RdfQuery = [
  ...publicWebIdProfileQuery,
  // find and fetch preferences file
  // https://solid.github.io/webid-profile/#discovery
  {
    type: 'match',
    subject: '?person',
    predicate: space.preferencesFile,
    pick: 'object',
    target: '?preferencesFile',
  },
  { type: 'add resources', variable: '?preferencesFile' },
  // find and fetch private type index
  {
    type: 'match',
    subject: '?person',
    predicate: solid.privateTypeIndex,
    pick: 'object',
    target: '?privateTypeIndex',
  },
  personInbox,
]

// in public type index, find all personal hospex documents of the person for a particular community, and fetch them
const partialHospexDocumentQuery: RdfQuery = [
  {
    type: 'match',
    subject: '?publicTypeIndex',
    predicate: dct.references,
    pick: 'object',
    target: '?typeRegistration',
  },
  {
    type: 'match',
    subject: '?typeRegistration',
    predicate: solid.forClass,
    object: hospex.PersonalHospexDocument,
    pick: 'subject',
    target: '?typeRegistrationForHospex',
  },
  {
    type: 'match',
    subject: '?typeRegistrationForHospex',
    predicate: solid.instance,
    pick: 'object',
    target: `?hospexDocument`,
  },
  { type: 'add resources', variable: '?hospexDocument' },
  {
    type: 'match',
    subject: '?person',
    predicate: sioc.member_of,
    object: '?community',
    pick: 'graph',
    target: '?hospexDocumentForCommunity',
  },
]

export const hospexDocumentQuery: RdfQuery = [
  ...publicWebIdProfileQuery,
  ...partialHospexDocumentQuery,
]

export const privateProfileAndHospexDocumentQuery: RdfQuery = [
  ...webIdProfileQuery,
  ...partialHospexDocumentQuery,
  {
    type: 'match',
    subject: '?person',
    predicate: space.preferencesFile,
    graph: '?hospexDocumentForCommunity',
    pick: 'object',
    target: '?hospexSettings',
  },
  personInbox,
]

export const readPersonAccommodationsQuery: RdfQuery = [
  ...hospexDocumentQuery,
  {
    type: 'match',
    subject: '?person',
    predicate: hospex.offers,
    graph: '?hospexDocumentForCommunity',
    pick: 'object',
    target: '?offer',
  },
  { type: 'add resources', variable: '?offer' },
]

export const readCommunityQuery: RdfQuery = [
  {
    type: 'match',
    subject: '?community',
    predicate: sioc.has_usergroup,
    pick: 'object',
    target: '?group',
  },
]

export const readCommunityMembersQuery: RdfQuery = [
  ...readCommunityQuery,
  {
    type: 'match',
    subject: '?group',
    predicate: vcard.hasMember,
    pick: 'object',
    target: '?person',
  },
]

/**
 * Fetch hosting offers from all community members
 * TODO there are security checks missing
 * we should make sure that accommodation is offered by the user who offers it (check both directions of the relationship)
 */
export const searchAccommodationsQuery: RdfQuery = [
  ...readCommunityMembersQuery,
  ...readPersonAccommodationsQuery,
]

export const inboxMessagesQuery: RdfQuery = [
  ...profileDocuments,
  personInbox,
  {
    type: 'match',
    subject: '?inbox',
    predicate: ldp.contains,
    pick: 'object',
    target: '?notification',
  },
  {
    type: 'match',
    subject: '?notification',
    predicate: rdf.type,
    object: as.Add,
    pick: 'subject',
    target: '?addNotification',
  },
  {
    type: 'match',
    subject: '?addNotification',
    predicate: as.context,
    object: 'https://www.pod-chat.com/LongChatMessage',
    pick: 'subject',
    target: '?longChatNotification',
  },
  {
    type: 'match',
    subject: '?longChatNotification',
    predicate: as.object,
    pick: 'object',
    target: '?message',
  },
  { type: 'add resources', variable: '?message' },
  {
    type: 'match',
    subject: '?longChatNotification',
    predicate: as.target,
    pick: 'object',
    target: '?chat',
  },
  { type: 'add resources', variable: '?chat' },
]

export const accommodationQuery: RdfQuery = [
  {
    type: 'match',
    subject: '?offer',
    predicate: hospex.offeredBy,
    pick: 'object',
    target: '?person',
  },
]

export const contactsQuery: RdfQuery = [
  ...profileDocuments,
  {
    type: 'match',
    subject: '?person',
    predicate: foaf.knows,
    pick: 'object',
    target: '?otherPerson',
  },
  {
    type: 'match',
    subject: '?otherPerson',
    predicate: rdfs.seeAlso, // TODO also include foaf.isPrimaryTopicOf
    pick: 'object',
    target: '?otherProfileDocument',
  },
  // fetch the profile documents
  { type: 'add resources', variable: '?otherProfileDocument' },
]

export const contactRequestsQuery: RdfQuery = [
  ...profileDocuments,
  personInbox,
  {
    type: 'match',
    subject: '?inbox',
    predicate: ldp.contains,
    pick: 'object',
    target: '?notification',
  },
  {
    type: 'match',
    subject: '?notification',
    predicate: rdf.type,
    object: as.Invite,
    pick: 'subject',
    target: '?inviteNotification',
  },
]

const chats: RdfQuery = [
  ...profileDocuments,
  {
    type: 'match',
    subject: '?person',
    predicate: space.preferencesFile,
    pick: 'object',
    target: '?preferencesFile',
  },
  { type: 'add resources', variable: '?preferencesFile' },
  // find and fetch private type index
  {
    type: 'match',
    subject: '?person',
    predicate: solid.privateTypeIndex,
    pick: 'object',
    target: '?privateTypeIndex',
  },
  {
    type: 'match',
    subject: '?privateTypeIndex',
    predicate: dct.references,
    pick: 'object',
    target: '?typeRegistration',
  },
  {
    type: 'match',
    subject: '?typeRegistration',
    predicate: solid.forClass,
    object: meeting.LongChat,
    pick: 'subject',
    target: '?typeRegistrationForChat',
  },
  {
    type: 'match',
    subject: '?typeRegistrationForChat',
    predicate: solid.instance,
    pick: 'object',
    target: `?chat`,
  },
  {
    type: 'match',
    subject: '?chat',
    predicate: wf.participation,
    pick: 'object',
    target: '?participation',
  },
]

const threadsQuery: RdfQuery = [
  ...chats,
  {
    type: 'match',
    subject: '?participation',
    predicate: dct.references,
    pick: 'object',
    target: '?otherChat',
  },
]

const chatsWithPerson: RdfQuery = [
  ...chats,
  {
    type: 'match',
    subject: '?participation',
    predicate: wf.participant,
    pick: 'object',
    target: '?participant',
  },
  {
    type: 'match',
    subject: '?participation',
    predicate: wf.participant,
    object: '?otherPerson',
    pick: 'subject',
    target: '?otherPersonParticipation',
  },
  {
    type: 'match',
    subject: '?participation',
    predicate: wf.participant,
    object: '?otherPerson',
    pick: 'subject',
    target: '?otherPersonParticipation',
  },
  {
    type: 'match',
    subject: '?chat',
    predicate: wf.participation,
    object: '?otherPersonParticipation',
    pick: 'subject',
    target: '?chatWithOtherPerson',
  },
  {
    type: 'match',
    subject: '?chatWithOtherPerson',
    predicate: wf.participation,
    pick: 'object',
    target: '?chatWithOtherPersonParticipation',
  },
  {
    type: 'match',
    subject: '?chatWithOtherPersonParticipation',
    predicate: dct.references,
    pick: 'object',
    target: '?otherChat',
  },
]

const messageTree: RdfQuery = [
  {
    type: 'match',
    subject: '?chatContainer',
    predicate: ldp.contains,
    pick: 'object',
    target: '?year',
  },
  {
    type: 'match',
    subject: '?year',
    predicate: ldp.contains,
    pick: 'object',
    target: '?month',
  },
  {
    type: 'match',
    subject: '?month',
    predicate: ldp.contains,
    pick: 'object',
    target: '?day',
  },
  {
    type: 'match',
    subject: '?day',
    predicate: ldp.contains,
    pick: 'object',
    target: '?messageDoc',
  },
  { type: 'add resources', variable: '?messageDoc' },
  {
    type: 'match',
    subject: '?chat',
    predicate: wf.message,
    pick: 'object',
    target: '?message',
  },
  {
    type: 'match',
    subject: '?otherChat',
    predicate: wf.message,
    pick: 'object',
    target: '?message',
  },
]

export const messages: RdfQuery = [
  ...chatsWithPerson,
  {
    type: 'transform variable',
    source: '?chatWithOtherPerson',
    target: '?chatContainer',
    transform: getContainer,
  },
  {
    type: 'transform variable',
    source: '?otherChat',
    target: '?chatContainer',
    transform: getContainer,
  },
  ...messageTree,
]

export const threads: RdfQuery = [
  ...threadsQuery,
  {
    type: 'transform variable',
    source: '?chat',
    target: '?chatContainer',
    transform: getContainer,
  },
  {
    type: 'transform variable',
    source: '?otherChat',
    target: '?chatContainer',
    transform: getContainer,
  },
  ...messageTree,
]
