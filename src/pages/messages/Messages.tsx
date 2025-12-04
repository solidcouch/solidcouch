import { Button } from '@/components'
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
import { useLocale } from '@/hooks/useLocale'
import {
  ChatShapeShapeType,
  MessageActivityShapeType,
} from '@/ldo/app.shapeTypes'
import { URI } from '@/types'
import { getContainer, removeHashFromURI } from '@/utils/helpers'
import { meeting } from '@/utils/rdf-namespaces'
import { ajvResolver } from '@hookform/resolvers/ajv'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset, graphOf } from '@ldo/ldo'
import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { JSONSchemaType } from 'ajv'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { FaPaperPlane } from 'react-icons/fa'
import { useParams } from 'react-router'
import { Message } from './Message'
import styles from './Messages.module.scss'
import { useSendMessage } from './useSendMessage'

const chatMessagesQuery = getChatMessagesQuery(Variables)

export const Messages = () => {
  const channelUri = useParams().channel!
  const auth = useAuth()
  const locale = useLocale()
  const firstLoad = useRef(true)
  const listRef = useRef<HTMLUListElement>(null)

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

  // scroll to bottom when messages first load
  useLayoutEffect(() => {
    if (!listRef.current) return
    if (!firstLoad.current) return
    if (!results.isMissing && !results.isLoading && channel.message2?.size) {
      listRef.current.scrollTop = listRef.current.scrollHeight
      firstLoad.current = false
    }
  }, [channel.message2?.size, results.isLoading, results.isMissing])

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

  return (
    <div className={styles.container}>
      <h2>{channel.title}</h2>
      {/* {channelUri}

      <ul>
        {channel.participation?.map(p => (
          <li key={p.participant['@id']}>{p.participant['@id']}</li>
        ))}
      </ul> */}

      <ul className={styles.messagesContainer} ref={listRef}>
        {channel.message2
          ?.map(msg => ({ ...msg }))
          .sort(
            (a, b) =>
              new Date(a.created).getTime() - new Date(b.created).getTime(),
          )
          .map((msg, i, messages) => {
            const isSameDateAsPrevious =
              i > 0 &&
              new Date(messages[i - 1]!.created).toLocaleDateString() ===
                new Date(msg.created).toLocaleDateString()
            const isSameMakerAsPrevious =
              i > 0 && messages[i - 1]!.maker['@id'] === msg.maker['@id']

            const showBadge = !isSameDateAsPrevious || !isSameMakerAsPrevious
            const msgDate = new Date(msg.created).toLocaleDateString(locale)

            return (
              <>
                {!isSameDateAsPrevious && (
                  <li
                    key={`date-${msgDate}`}
                    role="separator"
                    className={styles.daySeparator}
                  >
                    {msgDate}
                  </li>
                )}
                <li
                  key={msg['@id']}
                  data-testid={`message-${i}-${msg.maker['@id'] === auth.webId ? 'from' : 'to'}-me`}
                  id={msg['@id']}
                >
                  <Message
                    webid={msg.maker['@id']}
                    showBadge={showBadge}
                    message={msg.content}
                    created={new Date(msg.created)}
                  />
                </li>
              </>
            )
          })}
      </ul>

      <NewChatConfirmation uri={channelUri} />

      {isJoined && (
        <SendMessageForm
          disabled={!isReady}
          onSendMessage={async message => {
            firstLoad.current = true
            await handleSendMessage({ message, channel: channelUri })
          }}
        />
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

const validationSchema: JSONSchemaType<{ message: string }> = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string', minLength: 1, pattern: '\\S' },
  },
}

const SendMessageForm = ({
  disabled,
  onSendMessage,
}: {
  disabled?: boolean
  onSendMessage?: (message: string) => void
}) => {
  const { t } = useLingui()

  const {
    handleSubmit,
    register,
    formState: { isValid },
  } = useForm<{ message: string }>({
    resolver: ajvResolver<{ message: string }>(validationSchema),
  })
  const handleFormSubmit = handleSubmit(data => onSendMessage?.(data.message))

  return (
    <form onSubmit={handleFormSubmit} className={styles.sendForm}>
      <textarea
        autoFocus
        required
        className={styles.messageInput}
        {...register('message')}
        placeholder={t`Send a message…`}
      />
      <Button disabled={disabled || !isValid} aria-label={t`Send`} primary>
        <FaPaperPlane />
      </Button>
    </form>
  )
}
