import type { RdfQuery } from '@ldhop/core'
import { NamedNode, Term } from 'n3'
import { dct, ldp, rdf, solid } from 'rdf-namespaces'
import { getContainer } from '../../../utils/helpers'
import { as, meeting, space, wf } from '../../../utils/rdf-namespaces'
import { personInbox, profileDocuments } from './profile'

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

const getContainerNode = (term: Term) =>
  term.termType === 'NamedNode'
    ? new NamedNode(getContainer(term.value))
    : undefined

export const messages: RdfQuery = [
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

export const threads: RdfQuery = [
  ...threadsQuery,
  {
    type: 'transform variable',
    source: '?chat',
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
