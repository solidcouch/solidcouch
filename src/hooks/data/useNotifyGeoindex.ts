import { fetch } from '@inrupt/solid-client-authn-browser'
import { useMutation } from '@tanstack/react-query'
import { useConfig } from 'config/hooks'
import { useCallback, useMemo } from 'react'
import { HttpError } from 'utils/errors'

type NotificationData = {
  actor: string
  object: string
  type: 'Create' | 'Update' | 'Delete'
}

const getNotificationBody = ({ actor, object, type }: NotificationData) => ({
  '@context': 'https://www.w3.org/ns/activitystreams',
  type,
  actor: { type: 'Person', id: actor },
  object: { type: 'Document', id: object },
})

const notifyGeoindex = (service: string) => async (data: NotificationData) => {
  const response = await fetch(new URL('/inbox', service), {
    method: 'POST',
    body: JSON.stringify(getNotificationBody(data)),
    headers: { 'content-type': 'application/ld+json' },
  })

  if (!response.ok)
    throw new HttpError(
      response.status,
      'Geoindex responded with error',
      response,
    )

  return response.status
}

export const useNotifyGeoindex = () => {
  const { geoindexService } = useConfig()

  const { mutateAsync } = useMutation({
    mutationFn: notifyGeoindex(geoindexService!),
  })

  const isSetUp = Boolean(geoindexService)
  const run = useCallback(
    async (data: NotificationData) => await mutateAsync(data),
    [mutateAsync],
  )

  return useMemo(() => [isSetUp, run] as const, [isSetUp, run])
}
