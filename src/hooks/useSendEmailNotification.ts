import { fetch } from '@inrupt/solid-client-authn-browser'
import { useMutation } from '@tanstack/react-query'
import { communityId, emailNotificationsService } from 'config'
import { useCallback } from 'react'
import { useProfile } from './data/useProfile'

type Person = { id: string; name: string }
type MessageNotification = { messageId: string; message: string }
type MessageNotificationData = {
  from: Person
  to: Person
  messageId: string
  message: string
}

const getMessageNotificationBody = ({
  from,
  to,
  messageId,
  message,
}: MessageNotificationData) => ({
  '@context': 'https://www.w3.org/ns/activitystreams',
  type: 'Create',
  actor: {
    type: 'Person',
    id: from.id,
    name: from.name,
  },
  object: {
    type: 'Note',
    id: messageId,
    content: message,
  },
  target: {
    type: 'Person',
    id: to.id,
    name: to.name,
  },
})

// TODO make also notification for contact request, contact confirmation, ...

const sendNotification = async ({
  data,
}: {
  type: 'message'
  data: MessageNotificationData
}) => {
  const response = await fetch(
    new URL('notification', emailNotificationsService),
    {
      method: 'POST',
      body: JSON.stringify(getMessageNotificationBody(data)),
      headers: { 'content-type': 'application/ld+json' },
    },
  )
  if (!response.ok) throw new Error('not ok!')
}

export const useSendEmailNotification = ({
  from,
  to,
  community = communityId,
  type,
}: {
  from: string
  to: string
  community?: string
  type: 'message'
}) => {
  const [fromPerson] = useProfile(from, community)
  const [toPerson] = useProfile(to, community)

  const { mutateAsync } = useMutation({ mutationFn: sendNotification })

  return useCallback(
    async (data: MessageNotification) => {
      await mutateAsync({
        type,
        data: { ...data, from: fromPerson, to: toPerson },
      })
    },
    [fromPerson, mutateAsync, toPerson, type],
  )
}
