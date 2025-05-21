import { Button } from '@/components'
import { PersonBadge } from '@/components/PersonBadge/PersonBadge'
import {
  getChatMessagesQuery,
  getChatParticipantsQuery,
  getTypeIndexChatQuery,
  Variables,
} from '@/data/queries/chat'
import { addParticipant } from '@/hooks/data/mutations/chat'
import { inboxMessagesQuery } from '@/hooks/data/queries'
import { QueryKey } from '@/hooks/data/types'
import { useSolidProfile } from '@/hooks/data/useProfile'
import { useDeleteRdfDocument } from '@/hooks/data/useRdfDocument'
import { saveTypeRegistration } from '@/hooks/data/useSetupHospex'
import { useAuth } from '@/hooks/useAuth'
import {
  ChatShapeShapeType,
  MessageActivityShapeType,
} from '@/ldo/app.shapeTypes'
import { URI } from '@/types'
import { getContainer, removeHashFromURI } from '@/utils/helpers'
import { meeting } from '@/utils/rdf-namespaces'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset, graphOf } from '@ldo/ldo'
import { Trans } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { useSendMessage } from './useSendMessage'

const chatMessagesQuery = getChatMessagesQuery(Variables)

export const Messages = () => {
  const channelUri = useParams().channel!
  const auth = useAuth()

  const results = useLDhopQuery(
    useMemo(
      () => ({
        query: [...chatMessagesQuery, ...getChatParticipantsQuery(Variables)],
        variables: {
          channel: [channelUri],
          root: [getContainer(channelUri)],
        },
        fetch,
      }),
      [channelUri],
    ),
  )

  const channel = useMemo(
    () =>
      createLdoDataset(results.quads)
        .usingType(ChatShapeShapeType)
        .fromSubject(channelUri),
    [channelUri, results.quads],
  )

  const typeIndexChatResults = useLDhopQuery(
    useMemo(
      () => ({
        query: getTypeIndexChatQuery(),
        variables: { person: [auth.webId!] },
        fetch,
      }),
      [auth.webId],
    ),
  )
  const isJoined = typeIndexChatResults.variables.instance?.includes(channelUri)

  const [handleSendMessage, { isReady }] = useSendMessage(
    useMemo(
      () => ({
        sender: auth.webId!,
        receivers:
          channel.participation
            ?.map(p => p.participant['@id'])
            .filter(p => p !== auth.webId) ?? [],
      }),
      [auth.webId, channel.participation],
    ),
  )

  const { handleSubmit, register } = useForm<{ message: string }>()
  const handleFormSubmit = handleSubmit(async data => {
    await handleSendMessage({ message: data.message, channel: channelUri })
  })

  return (
    <div>
      <h2>{channel.title}</h2>
      {channelUri}

      <ul>
        {channel.participation?.map(p => (
          <li key={p.participant['@id']}>{p.participant['@id']}</li>
        ))}
      </ul>

      <ul>
        {channel.message2
          ?.map(msg => ({ ...msg }))
          .sort(
            (a, b) =>
              new Date(a.created).getTime() - new Date(b.created).getTime(),
          )
          .map((msg, i) => (
            <li
              key={msg['@id']}
              data-testid={`message-${i}-${msg.maker['@id'] === auth.webId ? 'from' : 'to'}-me`}
              id={msg['@id']}
            >
              <PersonBadge webId={msg.maker['@id']} />
              {msg.content}
              {msg.created}
            </li>
          ))}
      </ul>

      <NewChatConfirmation uri={channelUri} />

      {isJoined && (
        <form onSubmit={handleFormSubmit}>
          <textarea {...register('message')} />
          <button disabled={!isReady}>
            <Trans>Send</Trans>
          </button>
        </form>
      )}
    </div>
  )
}

const NewChatConfirmation = ({ uri }: { uri: URI }) => {
  const auth = useAuth()

  let loading = false

  const [solidProfile, { isFetched }] = useSolidProfile(auth.webId!)
  const privateTypeIndex = solidProfile.privateTypeIndex?.toArray()[0]?.['@id']

  loading ||= !isFetched || !privateTypeIndex

  const typeIndexChatResults = useLDhopQuery(
    useMemo(
      () => ({
        query: getTypeIndexChatQuery(),
        variables: { person: [auth.webId!] },
        fetch,
      }),
      [auth.webId],
    ),
  )

  loading ||=
    typeIndexChatResults.isLoading ||
    typeIndexChatResults.isMissing ||
    typeIndexChatResults.quads.length === 0

  const notificationResults = useLDhopQuery(
    useMemo(
      () => ({
        query: inboxMessagesQuery,
        variables: { person: [auth.webId!] },
        fetch,
      }),
      [auth.webId],
    ),
  )

  loading ||=
    notificationResults.isLoading ||
    notificationResults.isMissing ||
    notificationResults.quads.length === 0

  const channelNotifications = useMemo(
    () =>
      notificationResults.variables.messageNotification
        ?.map(msgn =>
          createLdoDataset(notificationResults.quads)
            .usingType(MessageActivityShapeType)
            .fromSubject(msgn),
        )
        .filter(n => n?.target?.['@id'] === uri)
        .flatMap(n => graphOf(n, 'type')) ?? [],
    [
      notificationResults.quads,
      notificationResults.variables.messageNotification,
      uri,
    ],
  )

  const queryClient = useQueryClient()

  const saveToPrivateTypeIndex = useMutation({
    mutationFn: saveTypeRegistration,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.rdfDocument, variables.index],
      })
    },
  })

  const addParticipantMutation = useMutation({
    mutationFn: addParticipant,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.rdfDocument, removeHashFromURI(variables.channel)],
      })
    },
  })

  const deleteNotification = useDeleteRdfDocument()

  const isNew =
    !typeIndexChatResults.isMissing &&
    !typeIndexChatResults.isLoading &&
    !typeIndexChatResults.variables.instance?.includes(uri)

  const handleContinue = async () => {
    // add self as participant to chat
    await addParticipantMutation.mutateAsync({
      channel: uri,
      participant: auth.webId!,
    })

    // save chat to private type index
    await saveToPrivateTypeIndex.mutateAsync({
      index: privateTypeIndex!,
      type: meeting.LongChat,
      location: uri,
    })
    // delete related notifications from inbox
    for (const n of channelNotifications!) {
      await deleteNotification.mutateAsync({ uri: n.value })
    }
  }
  const handleIgnore = async () => {
    // delete related notifications from inbox
    for (const n of channelNotifications!) {
      await deleteNotification.mutateAsync({ uri: n.value })
    }
  }

  if (loading) return <Trans>Loading</Trans>

  return isNew ? (
    <div>
      <Button primary onClick={handleContinue} disabled={loading}>
        <Trans>Continue</Trans>
      </Button>
      <Button danger onClick={handleIgnore} disabled={loading}>
        <Trans>Ignore</Trans>
      </Button>
    </div>
  ) : null
}
