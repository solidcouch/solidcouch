import { inboxMessagesQuery } from '@/hooks/data/queries'
import { getTypeIndexQuery } from '@/hooks/data/queries/typeIndex'
import { getContainer } from '@/utils/helpers'
import { meeting_extra, wf_extra } from '@/utils/rdf-namespaces'
import { ldhop, Variable } from '@ldhop/core'
import { NamedNode } from 'n3'
import * as dct from 'rdf-namespaces/dct'
import * as ldp from 'rdf-namespaces/ldp'
import * as wf from 'rdf-namespaces/wf'

export enum Variables {
  root = '?root',
  year = '?year',
  month = '?month',
  day = '?day',
  chatResource = '?chatResource',
  channel = '?channel',
  message = '?message',
}

export const getChatMessagesQuery = <
  Root extends Variable,
  Channel extends Variable,
  T extends Variable,
>(variables: {
  root: Root
  channel: Channel
  day: T
  month: T
  year: T
  chatResource: T
  message: T
}) =>
  ldhop<Root | Channel>(variables.root, variables.channel)
    .match(variables.root, ldp.contains)
    .o(variables.year)
    .match(variables.year, ldp.contains)
    .o(variables.month)
    .match(variables.month, ldp.contains)
    .o(variables.day)
    .match(variables.day, ldp.contains)
    .o(variables.chatResource)
    .add(variables.chatResource)
    .match(variables.channel, wf.message)
    .o(variables.message)

export const getTypeIndexChatQuery = () =>
  getTypeIndexQuery({ forClass: meeting_extra.LongChat })
    .match('?instance', wf_extra.participation)
    .o('?participation')

export const getChatParticipantsQuery = <T extends Variable>(variables: {
  channel: T
}) =>
  ldhop(variables.channel)
    .match(variables.channel, wf_extra.participation)
    .o('?participation')
    .match('?participation', wf_extra.participant)
    .o('?participant')

export const getChatLegacyLinkQuery = <T extends Variable>(variables: {
  channel: T
  root: T
}) =>
  ldhop('?participation')
    .match('?participation', dct.references)
    .o(variables.channel)
    .transform(variables.channel, variables.root, term =>
      term.termType === 'NamedNode'
        ? new NamedNode(getContainer(term.value))
        : undefined,
    )

export const threadsQuery = getTypeIndexQuery({
  forClass: meeting_extra.LongChat,
})
  // rename
  .transform('?instance', Variables.channel, t => t)
  .concat(inboxMessagesQuery)
  // rename
  .transform('?chat', Variables.channel, t => t)
  .transform(
    Variables.channel,
    Variables.root,
    term => new NamedNode(getContainer(term.value)),
  )
  .concat(getChatMessagesQuery(Variables))
  .concat(getChatParticipantsQuery(Variables))
