import { URI } from '@/types'
import { HttpError } from '@/utils/errors'
import { removeHashFromURI } from '@/utils/helpers'
import { solid, vcard } from '@/utils/rdf-namespaces'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useUpdateRdfDocument } from './useRdfDocument'

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

  return { ...data, status: response.status }
}

export const useJoinGroup = () => {
  const queryClient = useQueryClient()

  const { mutateAsync } = useMutation({
    mutationFn: notifyCommunityInbox,
    onSuccess: async data => {
      await queryClient.invalidateQueries({
        queryKey: ['rdfDocument', removeHashFromURI(data.object)],
      })
    },
  })
  return mutateAsync
}
