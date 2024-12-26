import { ChatShapeShapeType } from '@/ldo/app.shapeTypes'
import { Message, URI } from '@/types'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { useMemo } from 'react'
import { messages as messagesQuery } from './queries'
import { useReadMessagesFromInbox } from './useReadThreads'

export const useReadMessages = ({ me, userId }: { me: URI; userId: URI }) => {
  const { quads, variables, isLoading } = useLDhopQuery(
    useMemo(
      () => ({
        query: messagesQuery,
        variables: { person: [me], otherPerson: [userId] },
        fetch,
        staleTime: 30000,
      }),
      [me, userId],
    ),
  )

  const messages: Message[] = useMemo(() => {
    const dataset = createLdoDataset(quads).usingType(ChatShapeShapeType)
    const messages = (
      (variables.chatWithOtherPerson ?? [])
        .concat(variables.otherChat ?? [])
        .map(c => dataset.fromSubject(c))
        .filter(
          chat => chat.participation?.length && chat.participation.length <= 2,
        )
        .flatMap(chat =>
          chat?.message?.flatMap(
            message =>
              ({
                id: message['@id'],
                message: message.content,
                createdAt: new Date(message.created).getTime(),
                from: message.maker['@id'],
                chat: chat['@id'],
                test: chat.participation?.map(p => p.participant['@id']),
              }) as Message,
          ),
        ) ?? []
    ).filter(a => Boolean(a)) as Message[]

    return messages
  }, [quads, variables.chatWithOtherPerson, variables.otherChat])

  const myChats = useMemo(() => {
    const dataset = createLdoDataset(quads).usingType(ChatShapeShapeType)

    const chats = (variables.chatWithOtherPerson ?? [])
      .map(c => dataset.fromSubject(c))
      .filter(
        chat => chat.participation?.length && chat.participation.length <= 2,
      )
      .flatMap(ch =>
        ch['@id']
          ? {
              myChat: ch['@id'],
              otherChats: ch.participation?.[0].references?.flatMap(
                och => och['@id'] ?? [],
              ),
            }
          : [],
      )

    return chats
  }, [quads, variables.chatWithOtherPerson])

  const { data: allMessagesFromInbox, ...notificationsQueryStatus } =
    useReadMessagesFromInbox(me)

  const messagesFromInbox = useMemo(
    () => allMessagesFromInbox.filter(msg => msg.from === userId),
    [allMessagesFromInbox, userId],
  )

  // combine messages from inbox with messages, and sort them
  const combinedMessages = useMemo(() => {
    const combined = [...messages]

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

  return [
    combinedMessages,
    { isLoading: isLoading },
    notificationsQueryStatus,
    myChats,
  ] as const
}
