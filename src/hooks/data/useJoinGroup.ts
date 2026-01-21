import { URI } from '@/types'
import { HttpError } from '@/utils/errors'
import { removeHashFromURI } from '@/utils/helpers'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as solid from 'rdf-namespaces/solid'
import * as vcard from 'rdf-namespaces/vcard'
import { useCallback } from 'react'
import { QueryKey } from './types'
import { useUpdateRdfDocument } from './useRdfDocument'

/**
 * Join community by appending membership triple directly to the group
 * @deprecated This method of joining is unsafe, and will be removed in the future. Send Join activity to community inbox with `useJoinCommunity` instead.
 */
export const useJoinGroupLegacy = () => {
  const updateMutation = useUpdateRdfDocument()
  return useCallback(
    async ({ person, group }: { person: URI; group: URI }) => {
      const patch = `_:mutate a <${solid.InsertDeletePatch}>;
        <${solid.inserts}> { <${group}> <${vcard.hasMember}> <${person}>. } .`
      await updateMutation.mutateAsync({
        uri: group,
        patch,
      })
    },
    [updateMutation],
  )
}

type NotificationData = {
  actor: string
  object: string
  type: 'Join'
}

const getNotificationBody = ({ actor, object, type }: NotificationData) => ({
  '@context': 'https://www.w3.org/ns/activitystreams',
  type,
  actor: { type: 'Person', id: actor },
  object: { type: 'Group', id: object },
})

const notifyCommunityInbox = async ({
  inbox,
  ...data
}: NotificationData & { inbox: string }) => {
  const response = await fetch(inbox, {
    method: 'POST',
    body: JSON.stringify(getNotificationBody(data)),
    headers: { 'content-type': 'application/ld+json' },
  })

  if (!response.ok)
    throw new HttpError('Community inbox responded with error', response)

  const group = response.headers.get('location')

  return { ...data, status: response.status, group }
}

/**
 * Join community by sending "Join" activity to community inbox
 */
export const useJoinCommunity = () => {
  const queryClient = useQueryClient()

  const { mutateAsync } = useMutation({
    mutationFn: notifyCommunityInbox,
    onSuccess: async data => {
      if (!data.group) return
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.rdfDocument, removeHashFromURI(data.group)],
      })
    },
  })
  return mutateAsync
}
