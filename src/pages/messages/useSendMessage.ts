import { useConfig } from '@/config/hooks'
import {
  createMessage,
  createMessageNotification,
} from '@/hooks/data/mutations/chat'
import { hospexDocumentQuery, webIdProfileQuery } from '@/hooks/data/queries'
import { QueryKey } from '@/hooks/data/types'
import { sendNotification } from '@/hooks/useSendEmailNotification'
import {
  FoafProfileShapeType,
  HospexProfileShapeType,
  SolidProfileShapeType,
} from '@/ldo/app.shapeTypes'
import { FoafProfile, HospexProfile } from '@/ldo/app.typings'
import { URI } from '@/types'
import {
  getContainer,
  removeHashFromURI,
  useStableValue,
} from '@/utils/helpers'
import { ldo2json } from '@/utils/ldo'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { SolidLeafUri } from '@ldo/connected-solid'
import { createLdoDataset } from '@ldo/ldo'
import { t } from '@lingui/core/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import merge from 'lodash/merge'
import zipWith from 'lodash/zipWith'
import { NamedNode, Store } from 'n3'
import { useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'

export const useSendMessage = ({
  sender,
  receivers,
}: {
  sender: URI
  receivers: URI[]
}) => {
  const config = useConfig()

  const solidProfileResults = useLDhopQuery(
    useMemo(
      () => ({
        query: webIdProfileQuery,
        variables: { person: [sender, ...receivers] },
        fetch,
      }),
      [receivers, sender],
    ),
  )

  const receiverSolidProfiles = useMemo(
    () =>
      receivers.map(webId => {
        const dataset = createLdoDataset(solidProfileResults.quads)
        const profile = dataset
          .usingType(SolidProfileShapeType)
          .fromSubject(webId)
        return profile
      }),
    [receivers, solidProfileResults.quads],
  )

  const [profiles, { isReady }] = useProfiles(
    useMemo(() => [sender, ...receivers], [receivers, sender]),
  )

  const queryClient = useQueryClient()

  const messageMutation = useMutation({
    mutationFn: createMessage,
    onSuccess: async ({ messageUri }) => {
      toast.success(t`Message was created`)

      const todayChatResource = removeHashFromURI(messageUri)
      const dayContainer = getContainer(todayChatResource)
      const monthContainer = getContainer(dayContainer)
      const yearContainer = getContainer(monthContainer)
      const chatRootContainer = getContainer(yearContainer)

      await Promise.all(
        [
          todayChatResource,
          dayContainer,
          monthContainer,
          yearContainer,
          chatRootContainer,
        ].map(uri =>
          queryClient.invalidateQueries({
            queryKey: [QueryKey.rdfDocument, uri],
          }),
        ),
      )
    },
    onError: (error, variables, context) => {
      toast.error(
        t`Sending message failed` +
          error.name +
          error.message +
          variables +
          context,
      )
    },
  })

  const ldnMutation = useMutation({
    mutationFn: createMessageNotification,
    onSuccess: () => {
      toast.success(t`Linked Data Notification was sent.`)
    },
    onError: (error, variables, context) => {
      toast.error(
        t`Sending Linked Data Notification failed.` +
          error.name +
          error.message +
          variables +
          context,
      )
    },
  })

  const emailNotificationMutation = useMutation({
    mutationFn: sendNotification(config.emailNotificationsService),
    onSuccess: () => {
      toast.success(t`Email Notification was sent.`)
    },
    onError: (error, variables, context) => {
      toast.error(
        t`Sending Email Notification failed.` +
          error.name +
          error.message +
          variables +
          context,
      )
    },
  })

  const handleSendMessage = useCallback(
    async ({ message, channel }: { message: string; channel: string }) => {
      const { messageUri, created } = await messageMutation.mutateAsync({
        channel,
        message,
        maker: sender as SolidLeafUri,
      })

      await Promise.allSettled(
        receiverSolidProfiles.map(async solidProfile =>
          ldnMutation.mutateAsync({
            inbox: solidProfile.inbox['@id']!,
            senderId: sender,
            messageId: messageUri,
            chatId: channel,
            updated: created,
            content: message,
          }),
        ),
      )

      const [myProfile, ...otherProfiles] = profiles

      await Promise.allSettled(
        otherProfiles.map(profile => {
          return emailNotificationMutation.mutateAsync({
            type: 'message',
            data: {
              from: { id: sender, name: myProfile!.name! },
              to: { id: profile['@id'], name: profile.name! },

              messageId: messageUri,
              message,
            },
          })
        }),
      )
    },
    [
      emailNotificationMutation,
      ldnMutation,
      messageMutation,
      profiles,
      receiverSolidProfiles,
      sender,
    ],
  )
  return useMemo(
    () => [handleSendMessage, { isReady }] as const,
    [handleSendMessage, isReady],
  )
}

export const useProfiles = (webIdsUnstable: URI[]) => {
  const config = useConfig()

  const webIds = useStableValue(webIdsUnstable)

  const foafProfileResults = useLDhopQuery(
    useMemo(
      () => ({
        query: webIdProfileQuery,
        variables: { person: webIds },
        fetch,
      }),
      [webIds],
    ),
  )
  const hospexProfileResults = useLDhopQuery(
    useMemo(
      () => ({
        query: hospexDocumentQuery,
        variables: {
          person: webIds,
          community: [config.communityId],
        },
        fetch,
      }),
      [config.communityId, webIds],
    ),
  )

  const isReady = useMemo(() => {
    const isFoafProfilesReady =
      !foafProfileResults.isLoading &&
      !foafProfileResults.isMissing &&
      foafProfileResults.quads.length > 0
    const isHospexProfilesReady =
      !hospexProfileResults.isLoading &&
      !hospexProfileResults.isMissing &&
      hospexProfileResults.quads.length > 0

    return isFoafProfilesReady && isHospexProfilesReady
  }, [foafProfileResults, hospexProfileResults])

  const hospexProfiles = useMemo(
    () =>
      webIds.map(webId => {
        const hospexDocuments =
          hospexProfileResults.variables.hospexDocumentForCommunity ?? []
        const hospexGraphs = hospexDocuments.map(hospexDocument =>
          new Store(hospexProfileResults.quads).getQuads(
            null,
            null,
            null,
            new NamedNode(hospexDocument),
          ),
        )

        return hospexGraphs.map(hospexGraph =>
          createLdoDataset(hospexGraph)
            .usingType(HospexProfileShapeType)
            .fromSubject(webId),
        )
      }),
    [
      hospexProfileResults.quads,
      hospexProfileResults.variables.hospexDocumentForCommunity,
      webIds,
    ],
  )

  const foafProfiles = useMemo(() => {
    const { quads } = foafProfileResults

    return webIds.map(webId =>
      createLdoDataset(quads)
        .usingType(FoafProfileShapeType)
        .fromSubject(webId),
    )
  }, [foafProfileResults, webIds])

  // const profiles = zip(webIds, foafProfiles, hospexProfiles)
  const profiles = useMemo(
    () =>
      zipWith(
        webIds,
        foafProfiles,
        hospexProfiles,
        (
          webId,
          foafProfile,
          hospexProfiles,
        ): { '@id': URI } & FoafProfile & HospexProfile =>
          merge(
            {},
            { '@id': webId },
            ldo2json(foafProfile),
            ...hospexProfiles!.map(mhp => ldo2json(mhp)),
          ),
      ),
    [foafProfiles, hospexProfiles, webIds],
  )

  return useMemo(() => [profiles, { isReady }] as const, [isReady, profiles])
}
