import { ContainerShapeType, SolidProfileShapeType } from 'ldo/app.shapeTypes'
import { ChatShape } from 'ldo/app.typings'
import { cloneDeep } from 'lodash'
import { useMemo } from 'react'
import { Message, Thread, URI } from 'types'
import { getContainer } from 'utils/helpers'
import { useRdfQuery } from './useRdfQuery'

const threadsQuery = [
  ['?me', (a: string) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
  ['?profile', 'privateTypeIndex', '?privateTypeIndex'],
  ['?privateTypeIndex', 'references', '?typeRegistration'],
  ['?typeRegistration', 'forClass', 'LongChat'],
  ['?typeRegistration', 'instance', '?chat'],
  ['?chat', 'participation', '?participation'],
  ['?participation', 'references', '?otherChat'],
  ['?chat', getContainer, '?chatContainer', ContainerShapeType],
  ['?otherChat', getContainer, '?chatContainer', ContainerShapeType],
  ['?chatContainer', 'contains', '?year'],
  /**
   * TODO use only latest year, month and day
   * to avoid downloading unnecessary documents
   * this will require some query generalization
   *
   * we need to collect all years of particular chat, and then continue only with the latest year
   */
  ['?year', 'contains', '?month'],
  ['?month', 'contains', '?day'],
  ['?day', 'contains', '?messagesDoc'],
  ['?messagesDoc'],
  ['?chat', 'message', '?message'],
  ['?otherChat', 'message', '?message'],
] as const

const useReadThreadsOnly = (webId: URI) => {
  const [ldoResults, queryResults] = useRdfQuery(threadsQuery, { me: webId })

  const threads: Thread[] = useMemo(
    () =>
      (ldoResults.chat as ChatShape[])
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
        ),
    [ldoResults.chat],
  )

  return useMemo(
    () => ({ ...queryResults, data: threads }),
    [queryResults, threads],
  )
}

const inboxMessagesQuery = [
  ['?me', (a: string) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
  ['?profile', 'inbox', '?inbox'],
  ['?inbox', 'contains', '?notification'],
  ['?notification', 'type', 'Add'],
  ['?notification', 'context', 'https://www.pod-chat.com/LongChatMessage'],
  ['?notification', 'object', '?message'],
  ['?notification', 'target', '?chat'],
  ['?message'],
  ['?chat'],
] as const

export const useReadMessagesFromInbox = (webId: URI) => {
  const [partialResults, combinedQueryResults] = useRdfQuery(
    inboxMessagesQuery,
    { me: webId },
  )

  const messages: Message[] = useMemo(
    () =>
      partialResults.notification.map(notification => ({
        id: notification.object['@id'] ?? '',
        message: notification.object.content,
        createdAt: new Date(notification.object?.created).getTime(),
        from: notification.object.maker?.['@id'],
        chat: notification.target['@id'] ?? '',
        otherChats: notification.target.participation?.flatMap(
          p => p.references?.flatMap(r => r['@id'] ?? []) ?? [],
        ),
        notification: notification['@id'],
        status: 'unread',
      })),
    [partialResults.notification],
  )

  return useMemo(
    () => ({ ...combinedQueryResults, data: messages }),
    [combinedQueryResults, messages],
  )
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
