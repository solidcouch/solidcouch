import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import {
  ChatShapeShapeType,
  MessageActivityShapeType,
} from 'ldo/app.shapeTypes'
import { ChatShape } from 'ldo/app.typings'
import { cloneDeep } from 'lodash'
import { useMemo } from 'react'
import { Message, Thread, URI } from 'types'
import { getContainer } from 'utils/helpers'
import { inboxMessagesQuery, messageTree, threadsQuery } from './queries'

const useReadThreadsOnly = (webId: URI) => {
  const { quads, variables } = useLDhopQuery(
    useMemo(
      () => ({
        query: threadsQuery,
        variables: { person: [webId] },
        fetch,
      }),
      [webId],
    ),
  )

  const messageTreeResults = useLDhopQuery(
    useMemo(() => {
      const chat = variables.chat ?? []
      const otherChat = variables.otherChat ?? []
      const chatContainer = [...chat, ...otherChat].map(c => getContainer(c))
      return {
        query: messageTree,
        variables: { chat, otherChat, chatContainer },
        fetch,
      }
    }, [variables.chat, variables.otherChat]),
  )

  const threads: Thread[] = useMemo(() => {
    const dataset = createLdoDataset(
      quads.concat(messageTreeResults.quads),
    ).usingType(ChatShapeShapeType)

    return (
      (variables.chat ?? [])
        .map(chatId => dataset.fromSubject(chatId))
        .map(chat => {
          // chat uri
          const id = chat['@id'] as URI
          // referenced chat uris
          const related =
            chat.participation?.flatMap(
              p =>
                p.references
                  ?.flatMap(r => r['@id'] ?? [])
                  .filter(a => Boolean(a)) ?? [],
            ) ?? []
          // people who participate in the chat
          const participants =
            chat.participation?.map(p => p.participant['@id']) ?? []
          // memssages from all referenced chats
          const messages = [
            chat,
            ...((chat.participation?.flatMap(p => p.references) ?? []).filter(
              a => a,
            ) as ChatShape[]),
          ].flatMap(chat =>
            (chat.message ?? [])
              .map(msg => ({
                id: msg['@id'] as URI,
                message: msg.content,
                createdAt: new Date(msg.created).getTime(),
                from: msg.maker['@id'],
                chat: chat['@id'] as URI,
              }))
              .sort((a, b) => a.createdAt - b.createdAt),
          )

          return { id, related, participants, messages }
        })
        // sort the chats by time of the last message
        .sort(
          (a, b) =>
            ([...b.messages].pop()?.createdAt ?? 0) -
            ([...a.messages].pop()?.createdAt ?? 0),
        )
    )
  }, [messageTreeResults.quads, quads, variables.chat])

  return useMemo(() => ({ data: threads }), [threads])
}

// const inboxMessagesQueryLegacy = [
//   ['?me', (a: string) => a, '?profile', SolidProfileShapeType],
//   ['?profile', 'seeAlso', '?profileDocument'],
//   ['?profileDocument'],
//   ['?profile', 'inbox', '?inbox'],
//   ['?inbox', 'contains', '?notification'],
//   ['?notification', 'type', 'Add'],
//   ['?notification', 'context', 'https://www.pod-chat.com/LongChatMessage'],
//   ['?notification', 'object', '?message'],
//   ['?notification', 'target', '?chat'],
//   ['?message'],
//   ['?chat'],
// ] as const

export const useReadMessagesFromInbox = (webId: URI) => {
  const { quads, variables, isLoading } = useLDhopQuery(
    useMemo(
      () => ({
        query: inboxMessagesQuery,
        variables: { person: webId ? [webId] : [] },
        fetch,
      }),
      [webId],
    ),
  )

  const messages: Message[] = useMemo(
    () =>
      (variables.longChatNotification ?? []).map(notification => {
        const ldo = createLdoDataset(quads)
          .usingType(MessageActivityShapeType)
          .fromSubject(notification)

        return {
          id: ldo.object['@id'] ?? '',
          message: ldo.object.content,
          createdAt: new Date(ldo.object?.created).getTime(),
          from: ldo.object.maker?.['@id'],
          chat: ldo.target['@id'] ?? '',
          otherChats: ldo.target.participation?.flatMap(
            p => p.references?.flatMap(r => r['@id'] ?? []) ?? [],
          ),
          notification: ldo['@id'],
          status: 'unread',
        }
      }),
    [quads, variables.longChatNotification],
  )

  return useMemo(() => ({ isLoading, data: messages }), [isLoading, messages])
}

export const useReadThreads = (webId: URI) => {
  const { data: threads } = useReadThreadsOnly(webId)
  const { data: inboxMessages } = useReadMessagesFromInbox(webId)

  const combinedThreads: Thread[] = useMemo(() => {
    const combined = cloneDeep(threads)
    inboxMessages.forEach(imsg => {
      // find thread
      const thread = combined.find(
        t => t.related.includes(imsg.chat) || imsg.otherChats?.includes(t.id),
      )
      if (thread) {
        thread.status = 'unread'
        const msgIndex = thread.messages.findIndex(msg => msg.id === imsg.id)
        if (msgIndex > -1) {
          thread.messages[msgIndex] = imsg
        } else {
          thread.messages.push(imsg)
          thread.messages.sort((a, b) => a.createdAt - b.createdAt)
        }
      } else {
        combined.push({
          id: imsg.chat,
          related: [imsg.chat],
          messages: [imsg],
          participants: [imsg.from],
          status: 'new',
        })
        combined.sort(
          (a, b) =>
            ([...b.messages].pop()?.createdAt ?? 0) -
            ([...a.messages].pop()?.createdAt ?? 0),
        )
      }
    })
    return combined
  }, [inboxMessages, threads])

  return { data: combinedThreads }
}
