import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { ChatShapeShapeType } from 'ldo/app.shapeTypes'
import { Store } from 'n3'
import { useMemo } from 'react'
import { Message, URI } from 'types'
import { getContainer } from 'utils/helpers'
import { wf } from 'utils/rdf-namespaces'
import { chatsWithPerson, messageTree } from './queries'
import { useReadMessagesFromInbox } from './useReadThreads'

export const useReadMessages = ({ me, userId }: { me: URI; userId: URI }) => {
  const { quads, variables, isLoading } = useLDhopQuery(
    useMemo(
      () => ({
        query: chatsWithPerson,
        variables: { person: [me], otherPerson: [userId] },
        fetch,
      }),
      [me, userId],
    ),
  )

  const messageTreeResults = useLDhopQuery(
    useMemo(() => {
      const chat = variables.chatWithOtherPerson ?? []
      const chatInTwo = chat.filter(c => {
        const s = new Store(quads)
        const participations = s.getObjects(c, wf.participation, null)

        return participations.length > 0 && participations.length <= 2
      })
      const otherChat = variables.otherChat ?? []
      const chatContainer = [...chatInTwo, ...otherChat].map(c =>
        getContainer(c),
      )
      return {
        query: messageTree,
        variables: { chat: chatInTwo, otherChat, chatContainer },
        fetch,
      }
    }, [quads, variables.chatWithOtherPerson, variables.otherChat]),
  )

  const messages: Message[] = useMemo(() => {
    const dataset = createLdoDataset(
      quads.concat(messageTreeResults.quads),
    ).usingType(ChatShapeShapeType)
    const messages = (
      (variables.chatWithOtherPerson ?? [])
        .concat(variables.otherChat ?? [])
        .map(c => dataset.fromSubject(c))
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
              } as Message),
          ),
        ) ?? []
    ).filter(a => Boolean(a)) as Message[]

    return messages
  }, [
    messageTreeResults.quads,
    quads,
    variables.chatWithOtherPerson,
    variables.otherChat,
  ])

  const myChats = useMemo(() => {
    const dataset = createLdoDataset(
      quads.concat(messageTreeResults.quads),
    ).usingType(ChatShapeShapeType)

    const chats = (variables.chatWithOtherPerson ?? [])
      .map(c => dataset.fromSubject(c))
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
  }, [messageTreeResults.quads, quads, variables.chatWithOtherPerson])

  const { data: allMessagesFromInbox, ...notificationsQueryStatus } =
    useReadMessagesFromInbox(me)

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

  return [
    combinedMessages,
    { isLoading: isLoading || messageTreeResults.isLoading },
    notificationsQueryStatus,
    myChats,
  ] as const
}
