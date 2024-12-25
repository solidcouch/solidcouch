import { fetch } from '@inrupt/solid-client-authn-browser'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ngeohash from 'ngeohash'
import { useCallback, useMemo } from 'react'
import { useConfig } from '../../config/hooks.ts'
import { Location } from '../../types/index.ts'
import { HttpError } from '../../utils/errors.ts'

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

const notifyGeoindex =
  (service: string) =>
  async (
    data: NotificationData & {
      previousLocation?: Location
      currentLocation?: Location
    },
  ) => {
    const response = await fetch(new URL('/inbox', service), {
      method: 'POST',
      body: JSON.stringify(getNotificationBody(data)),
      headers: { 'content-type': 'application/ld+json' },
    })

    if (!response.ok)
      throw new HttpError('Geoindex responded with error', response)

    return { ...data, status: response.status }
  }

const getPrefixes = (s: string = '') => {
  const prefixes: string[] = []

  for (let i = 1; i <= s.length; i++) {
    prefixes.push(s.substring(0, i))
  }

  return prefixes
}

export const useNotifyGeoindex = () => {
  const { geoindexService } = useConfig()
  const queryClient = useQueryClient()

  const { mutateAsync } = useMutation({
    mutationFn: notifyGeoindex(geoindexService!),
    onSuccess: async ({ previousLocation, currentLocation }) => {
      const geohashes = []

      if (previousLocation) {
        const geohash = ngeohash.encode(
          previousLocation.lat,
          previousLocation.long,
          10,
        )
        geohashes.push(...getPrefixes(geohash))
      }
      if (currentLocation) {
        const geohash = ngeohash.encode(
          currentLocation.lat,
          currentLocation.long,
          10,
        )
        geohashes.push(...getPrefixes(geohash))
      }

      await Promise.allSettled(
        geohashes.map(geohash =>
          queryClient.invalidateQueries({ queryKey: ['geoindex', geohash] }),
        ),
      )
    },
  })

  const isSetUp = Boolean(geoindexService)
  const run = useCallback(
    async (
      data: NotificationData & {
        previousLocation?: Location
        currentLocation?: Location
      },
    ) => await mutateAsync(data),
    [mutateAsync],
  )

  return useMemo(() => [isSetUp, run] as const, [isSetUp, run])
}
