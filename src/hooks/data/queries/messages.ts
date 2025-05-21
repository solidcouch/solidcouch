import { getContainer } from '@/utils/helpers'
import { meeting, wf } from '@/utils/rdf-namespaces'
import type { Constant, LdhopQuery } from '@ldhop/core'
import { NamedNode, Term } from 'n3'
import {
  as,
  dct,
  ldp,
  rdf,
  schema,
  schema_https,
  solid,
  space,
} from 'rdf-namespaces'
import { LdhopQueryVars, personInbox, profileDocuments } from './profile'

export const inboxMessagesQuery: LdhopQuery<
  | LdhopQueryVars<typeof profileDocuments>
  | '?inbox'
  | '?notification'
  | '?message'
  | '?chat'
  | '?createNotification'
  | '?messageNotification'
  | '?object'
  | '?messageObject'
> = [
  ...profileDocuments,
  personInbox,
  {
    type: 'match',
    subject: `?inbox`,
    predicate: ldp.contains,
    pick: 'object',
    target: `?notification`,
  },
  {
    // deprecated
    type: 'match',
    subject: `?notification`,
    predicate: rdf.type,
    object: as.Add,
    pick: 'subject',
    target: `?createNotification`,
  },
  {
    // deprecated
    type: 'match',
    subject: `?notification`,
    predicate: rdf.type,
    object: as.Create,
    pick: 'subject',
    target: `?createNotification`,
  },
  {
    // deprecated
    type: 'match',
    subject: `?createNotification`,
    predicate: as.context,
    object: 'https://www.pod-chat.com/LongChatMessage',
    pick: 'subject',
    target: `?messageNotification`,
  },
  {
    type: 'match',
    subject: `?createNotification`,
    predicate: as.object,
    pick: 'object',
    target: `?object`,
  },
  {
    type: 'match',
    subject: `?object`,
    predicate: rdf.type,
    object: schema.Message,
    pick: 'subject',
    target: `?messageObject`,
  },
  {
    type: 'match',
    subject: `?object`,
    predicate: rdf.type,
    object: schema_https.Message,
    pick: 'subject',
    target: `?messageObject`,
  },
  {
    type: 'match',
    predicate: as.object,
    object: `?messageObject`,
    pick: 'subject',
    target: `?messageNotification`,
  },
  {
    type: 'match',
    subject: `?messageNotification`,
    predicate: as.object,
    pick: 'object',
    target: `?message`,
  },
  { type: 'add resources', variable: `?message` },
  {
    type: 'match',
    subject: `?messageNotification`,
    predicate: as.target,
    pick: 'object',
    target: `?chat`,
  },
  { type: 'add resources', variable: `?chat` },
]

const chats: LdhopQuery<
  | '?person'
  | '?profileDocument'
  | '?preferencesFile'
  | '?typeRegistration'
  | '?privateTypeIndex'
  | '?typeRegistrationForChat'
  | '?chat'
  | '?participation'
> = [
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
    predicate: rdf.type,
    object: solid.TypeRegistration,
    graph: '?privateTypeIndex',
    pick: 'subject',
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
    predicate: wf.participation as Constant,
    pick: 'object',
    target: '?participation',
  },
]

// const threadsQuery: LdhopQuery<LdhopQueryVars<typeof chats> | '?otherChat'> = [
//   ...chats,
//   {
//     type: 'match',
//     subject: '?participation',
//     predicate: dct.references,
//     pick: 'object',
//     target: '?otherChat',
//   },
// ]
// const threadsQuery: RdfQuery = [
//   ...chats,
//   {
//     type: 'match',
//     subject: '?participation',
//     predicate: dct.references,
//     pick: 'object',
//     target: '?otherChat',
//   },
// ]

const chatsWithPerson: LdhopQuery<
  | LdhopQueryVars<typeof chats>
  | '?otherPerson'
  | '?otherPersonParticipation'
  | '?participant'
  | '?chatWithOtherPerson'
  | '?chatWithOtherPersonParticipation'
  | '?otherChat'
> = [
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

const messageTree: LdhopQuery<
  | '?chatContainer'
  | '?year'
  | '?month'
  | '?day'
  | '?messageDoc'
  | '?chat'
  | '?otherChat'
  | '?message'
> = [
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

const getContainerNode = (term: Term) =>
  term.termType === 'NamedNode'
    ? new NamedNode(getContainer(term.value))
    : undefined

export const messages: LdhopQuery<
  LdhopQueryVars<typeof chatsWithPerson> | LdhopQueryVars<typeof messageTree>
> = [
  ...chatsWithPerson,
  {
    type: 'transform variable',
    source: '?chatWithOtherPerson',
    target: '?chatContainer',
    transform: getContainerNode,
  },
  {
    type: 'transform variable',
    source: '?otherChat',
    target: '?chatContainer',
    transform: getContainerNode,
  },
  ...messageTree,
]

// export const threads: LdhopQuery<
//   LdhopQueryVars<typeof threadsQuery> | LdhopQueryVars<typeof messageTree>
// > = [
//   ...threadsQuery,
//   {
//     type: 'transform variable',
//     source: '?chat',
//     target: '?chatContainer',
//     transform: getContainerNode,
//   },
//   {
//     type: 'transform variable',
//     source: '?otherChat',
//     target: '?chatContainer',
//     transform: getContainerNode,
//   },
//   ...messageTree,
// ]
// export const threads: RdfQuery = [
//   ...threadsQuery,
//   {
//     type: 'transform variable',
//     source: '?chat',
//     target: '?chatContainer',
//     transform: getContainerNode,
//   },
//   {
//     type: 'transform variable',
//     source: '?otherChat',
//     target: '?chatContainer',
//     transform: getContainerNode,
//   },
//   ...messageTree,
// ]
