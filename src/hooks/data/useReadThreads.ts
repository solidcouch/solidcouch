import {
  ChatShapeShapeType,
  MessageActivityShapeType,
} from '@/ldo/app.shapeTypes'
import { ChatShape } from '@/ldo/app.typings'
import { Message, Thread, URI } from '@/types'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import cloneDeep from 'lodash/cloneDeep'
import { useMemo } from 'react'
import { inboxMessagesQuery, threads as threadsQuery } from './queries'

const useReadThreadsOnly = (webId: URI) => {
  const { quads, variables } = useLDhopQuery(
    useMemo(
      () => ({
        query: threadsQuery,
        variables: { person: [webId] },
        staleTime: 30000,
        fetch,
      }),
      [webId],
    ),
  )

  const threads: Thread[] = useMemo(() => {
    const dataset = createLdoDataset(quads).usingType(ChatShapeShapeType)

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
  }, [quads, variables.chat])

  return useMemo(() => ({ data: threads }), [threads])
}

export const useReadMessagesFromInbox = (webId: URI) => {
  const { quads, variables, isLoading } = useLDhopQuery(
    useMemo(
      () => ({
        query: inboxMessagesQuery,
        variables: { person: webId ? [webId] : [] },
        fetch,
        staleTime: 30000,
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
          createdAt: new Date(ldo.object?.created ?? ldo.updated).getTime(),
          from: ldo.object.maker?.['@id'] ?? ldo.actor?.['@id'],
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
        }
      } else {
        combined.push({
          id: imsg.chat,
          related: [imsg.chat],
          messages: [imsg],
          participants: [imsg.from],
          status: 'new',
        })
      }
    })

    for (const c of combined) {
      c.messages.sort((a, b) => (a?.createdAt ?? 0) - (b?.createdAt ?? 0))
    }

    combined.sort(
      (a, b) =>
        ([...b.messages].pop()?.createdAt ?? 0) -
        ([...a.messages].pop()?.createdAt ?? 0),
    )
    return combined
  }, [inboxMessages, threads])

  return { data: combinedThreads }
}
