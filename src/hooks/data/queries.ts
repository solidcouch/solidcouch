import type { Match, RdfQuery } from '@ldhop/core'
import { dct, foaf, ldp, rdf, sioc, solid, vcard } from 'rdf-namespaces'
import { as, hospex, rdfs, space } from 'utils/rdf-namespaces'

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
