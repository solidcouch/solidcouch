import { ContainerShapeType, SolidProfileShapeType } from 'ldo/app.shapeTypes'
import { ChatShape } from 'ldo/app.typings'
import { useMemo } from 'react'
import { Message, URI } from 'types'
import { getContainer } from 'utils/helpers'
import { useRdfQuery } from './useRdfQuery'
import { useReadMessagesFromInbox } from './useReadThreads'

const messagesQuery = [
  ['?me', (a: string) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
  ['?profile', 'privateTypeIndex', '?privateTypeIndex'],
  ['?privateTypeIndex', 'references', '?typeRegistration'],
  ['?typeRegistration', 'forClass', 'LongChat'],
  ['?typeRegistration', 'instance', '?chat'],
  // keep only chat that is with userId person, and only them
  [
    '?chat',
    (ldo: ChatShape, params: { userId: URI }) =>
      typeof ldo.participation?.length === 'number' &&
      ldo.participation.length < 3 &&
      ldo.participation.some(p => p.participant['@id'] === params.userId),
  ],
  ['?chat', 'participation', '?participation'],
  ['?participation', 'references', '?otherChat'],
  ['?chat', 'message', '?message'],
  ['?otherChat', 'message', '?message'],
  ['?chat', getContainer, '?chatContainer', ContainerShapeType],
  ['?otherChat', getContainer, '?chatContainer', ContainerShapeType],
  ['?chatContainer', 'contains', '?year'],
  ['?year', 'contains', '?month'],
  ['?month', 'contains', '?day'],
  ['?day', 'contains', '?messagesDoc'],
  ['?messagesDoc'],
  ['?message'],
] as const

export const useReadMessages = ({ me, userId }: { me: URI; userId: URI }) => {
  const params = useMemo(() => ({ me, userId }), [me, userId])
  const [results, queryStatus] = useRdfQuery(messagesQuery, params)

  const messages = (
    results.chat.concat(results.otherChat).flatMap(chat =>
      (chat as ChatShape)?.message?.flatMap(
        message =>
          ({
            id: message['@id'],
            message: message.content,
            createdAt: new Date(message.created).getTime(),
            from: message.maker['@id'],
            chat: chat['@id'],
            test: (chat as ChatShape).participation?.map(
              p => p.participant['@id'],
            ),
          } as Message),
      ),
    ) ?? []
  ).filter(a => Boolean(a)) as Message[]

  const { data: allMessagesFromInbox } = useReadMessagesFromInbox(me)

  const messagesFromInbox = useMemo(
    () => allMessagesFromInbox.filter(msg => msg.from === userId),
    [allMessagesFromInbox, userId],
  )

  // combine messages from inbox with messages, and sort them
  const combinedMessages = useMemo(() => {
    let combined = [...messages]

    messagesFromInbox.forEach(inboxMessage => {
      // if message is there, update status of the message
      const msgIndex = messages.findIndex(
        message => message.id === inboxMessage.id,
      )
      if (msgIndex > -1) {
        combined[msgIndex] = inboxMessage
      }
      // otherwise add it to the array of messages
      else {
        combined.push(inboxMessage)
      }
    })
    return combined.sort((a, b) => (a?.createdAt ?? 0) - (b?.createdAt ?? 0))
  }, [messages, messagesFromInbox])

  return [combinedMessages, queryStatus] as const
}
