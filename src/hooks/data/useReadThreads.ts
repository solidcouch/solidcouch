import { MessageActivityShapeType } from '@/ldo/app.shapeTypes'
import { Message, URI } from '@/types'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { useMemo } from 'react'
import { inboxMessagesQuery } from './queries'

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
      (variables['messageNotification'] ?? []).map(notification => {
        const ldo = createLdoDataset(quads)
          .usingType(MessageActivityShapeType)
          .fromSubject(notification)

        return {
          id: ldo.object['@id'] ?? '',
          message: ldo.object.content,
          createdAt: new Date(ldo.object.created).getTime(),
          from: ldo.object.maker?.['@id'] ?? ldo.actor?.['@id'],
          chat: ldo.target['@id'] ?? '',
          otherChats: ldo.target.participation
            ?.map(p => p.references?.map(r => r['@id'] ?? []).flat() ?? [])
            .flat(),
          notification: ldo['@id'],
          status: 'unread',
        }
      }),
    [quads, variables],
  )

  return useMemo(() => ({ isLoading, data: messages }), [isLoading, messages])
}
