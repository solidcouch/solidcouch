import { getContainer } from '@/utils/helpers'
import { meeting_extra, wf_extra } from '@/utils/rdf-namespaces'
import { ldhop, type Constant } from '@ldhop/core'
import { NamedNode, Term } from 'n3'
import * as as from 'rdf-namespaces/as'
import * as dct from 'rdf-namespaces/dct'
import * as ldp from 'rdf-namespaces/ldp'
import * as rdf from 'rdf-namespaces/rdf'
import * as schema from 'rdf-namespaces/schema'
import { Message as Message_https } from 'rdf-namespaces/schema_https'
import * as solid from 'rdf-namespaces/solid'
import * as space from 'rdf-namespaces/space'
import * as wf from 'rdf-namespaces/wf'
import { profileDocuments } from './profile'

export const inboxMessagesQuery = profileDocuments
  .match('?person', ldp.inbox)
  .o('?inbox')
  .match('?inbox', ldp.contains)
  .o('?notification')
  // deprecated
  .match('?notification', rdf.type, as.Add)
  .s('?createNotification')
  // deprecated
  .match('?notification', rdf.type, as.Create)
  .s('?createNotification')
  // deprecated
  .match(
    '?createNotification',
    as.context,
    'https://www.pod-chat.com/LongChatMessage',
  )
  .s('?messageNotification')
  .match('?createNotification', as.object)
  .o('?object')
  .match('?object', rdf.type, schema.Message)
  .s('?messageObject')
  .match('?object', rdf.type, Message_https)
  .s('?messageObject')
  .match(null, as.object, '?messageObject')
  .s('?messageNotification')
  .match('?messageNotification', as.object)
  .o('?message')
  .add()
  .match('?messageNotification', as.target)
  .o('?chat')
  .add()

const chats = profileDocuments
  .match('?person', space.preferencesFile)
  .o('?preferencesFile')
  .add()
  // find and fetch private type index
  .match('?person', solid.privateTypeIndex)
  .o('?privateTypeIndex')
  .match(null, rdf.type, solid.TypeRegistration, '?privateTypeIndex')
  .s('?typeRegistration')
  .match('?typeRegistration', solid.forClass, meeting_extra.LongChat)
  .s('?typeRegistrationForChat')
  .match('?typeRegistrationForChat', solid.instance)
  .o('?chat')
  .match('?chat', wf_extra.participation as Constant)
  .o('?participation')

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

const chatsWithPerson = ldhop('?person', '?otherPerson')
  .concat(chats)
  .match('?participation', wf_extra.participant)
  .o('?participant')
  .match('?participation', wf_extra.participant, '?otherPerson')
  .s('?otherPersonParticipation')
  .match('?chat', wf_extra.participation, '?otherPersonParticipation')
  .s('?chatWithOtherPerson')
  .match('?chatWithOtherPerson', wf_extra.participation)
  .o('?chatWithOtherPersonParticipation')
  // deprecated
  .match('?chatWithOtherPersonParticipation', dct.references)
  .o('?otherChat')

const messageTree = ldhop('?chatContainer', '?chat', '?otherChat')
  .match('?chatContainer', ldp.contains)
  .o('?year')
  .match('?year', ldp.contains)
  .o('?month')
  .match('?month', ldp.contains)
  .o('?day')
  .match('?day', ldp.contains)
  .o('?messageDoc')
  .add()
  .match('?chat', wf.message)
  .o('?message')
  .match('?otherChat', wf.message)
  .o('?message')

const getContainerNode = (term: Term) =>
  term.termType === 'NamedNode'
    ? new NamedNode(getContainer(term.value))
    : undefined

export const messages = chatsWithPerson
  .transform('?chatWithOtherPerson', '?chatContainer', getContainerNode)
  .transform('?otherChat', '?chatContainer', getContainerNode)
  .concat(messageTree)

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
