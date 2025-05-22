import { inboxMessagesQuery } from '@/hooks/data/queries'
import { getTypeIndexQuery } from '@/hooks/data/queries/typeIndex'
import { meeting, wf } from '@/utils/rdf-namespaces'
import { RdfQuery } from '@ldhop/core'
import { ldp } from 'rdf-namespaces'

export enum Variables {
  root = '?root',
  year = '?year',
  month = '?month',
  day = '?day',
  chatResource = '?chatResource',
  channel = '?channel',
  message = '?message',
}

type Vars = keyof typeof Variables

export const getChatMessagesQuery = (variables: {
  [K in Vars]: `?${string}`
}): RdfQuery => [
  {
    type: 'match',
    subject: variables.root,
    predicate: ldp.contains,
    pick: 'object',
    target: variables.year,
  },
  {
    type: 'match',
    subject: variables.year,
    predicate: ldp.contains,
    pick: 'object',
    target: variables.month,
  },
  {
    type: 'match',
    subject: variables.month,
    predicate: ldp.contains,
    pick: 'object',
    target: variables.day,
  },
  {
    type: 'match',
    subject: variables.day,
    predicate: ldp.contains,
    pick: 'object',
    target: variables.chatResource,
  },
  { type: 'add resources', variable: variables.chatResource },
  {
    type: 'match',
    subject: variables.channel,
    predicate: meeting.message,
    pick: 'object',
    target: variables.message,
  },
  // deprecated - for backwards compatibility
  {
    type: 'match',
    subject: variables.channel,
    predicate: wf.message, // deprecated predicate
    pick: 'object',
    target: variables.message,
  },
]

export const getTypeIndexChatQuery = (): RdfQuery => [
  ...getTypeIndexQuery({ forClass: meeting.LongChat }),
  {
    type: 'match',
    subject: '?instance',
    predicate: wf.participation,
    pick: 'object',
    target: '?participation',
  },
]

export const getChatParticipantsQuery = (variables: {
  [K in Vars]: `?${string}`
}): RdfQuery => [
  {
    type: 'match',
    subject: variables.channel,
    predicate: wf.participation,
    pick: 'object',
    target: '?participation',
  },
  {
    type: 'match',
    subject: '?participation',
    predicate: wf.participant,
    pick: 'object',
    target: '?participant',
  },
]

export const threadsQuery: RdfQuery = [
  ...getTypeIndexQuery({ forClass: meeting.LongChat }),
  {
    type: 'match',
    object: '?instance',
    pick: 'object',
    target: Variables.channel,
  },
  ...inboxMessagesQuery,
  {
    type: 'match',
    object: '?chat',
    pick: 'object',
    target: Variables.channel,
  },
  ...getChatMessagesQuery(Variables),
  ...getChatParticipantsQuery(Variables),
]
