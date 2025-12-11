import { Button } from '@/components'
import { PersonMini } from '@/components/PersonMini/PersonMini'
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
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset, graphOf } from '@ldo/ldo'
import { Trans } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { Message } from './Message'
import styles from './Messages.module.scss'
import { SendMessageForm } from './SendMessageForm'
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

  // const isInProgress = results.isLoading || results.isMissing

  const channel = useMemo(
    () =>
      createLdoDataset(results.quads)
        .usingType(ChatShapeShapeType)
        .fromSubject(channelUri),
    [channelUri, results.quads],
  )

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

  const channelNotifications = useMemo(
    () =>
      notificationResults.variables.messageNotification
        ?.map(msgn =>
          createLdoDataset(notificationResults.quads)
            .usingType(MessageActivityShapeType)
            .fromSubject(msgn),
        )
        .filter(n => n?.target?.['@id'] === channelUri)
        .flatMap(n => ({
          messageUri: n.object['@id'],
          graphUri: graphOf(n, 'type', { '@id': 'Create' })[0]?.value,
        })) ?? [],
    [
      channelUri,
      notificationResults.quads,
      notificationResults.variables.messageNotification,
    ],
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

  // do i have the channel in my type indexes?
  const isSavedInTypeIndex =
    typeIndexChatResults.variables.instance?.includes(channelUri)
  // is the url a chat channel?
  const isChat = channel.type?.['@id'] === 'LongChat'
  // am i a participant?
  const isParticipant =
    isChat &&
    channel.participation?.some(p => p.participant['@id'] === auth.webId)

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

  // unread messages
  const [unread, setUnread] = useState(new Set<URI>())
  const deleteNotification = useDeleteRdfDocument()

  useEffect(() => {
    for (const { messageUri } of channelNotifications) {
      // remember message URI
      if (messageUri)
        setUnread(unr => {
          if (unr.has(messageUri)) return unr
          const nextSet = new Set(unr)
          nextSet.add(messageUri)
          return nextSet
        })
    }
  }, [channelNotifications])

  const processed = useRef(new Set<string>())

  useEffect(() => {
    if (isSavedInTypeIndex) {
      for (const n of channelNotifications) {
        if (n.graphUri && !processed.current.has(n.graphUri)) {
          deleteNotification.mutate({ uri: n.graphUri })
          processed.current.add(n.graphUri)
        }
      }
    }
  }, [channelNotifications, deleteNotification, isSavedInTypeIndex])

  if (!isChat)
    return (
      <div data-testid="not-a-chat-message">
        <Trans>There doesn't seem to be a chat here.</Trans>
      </div>
    )

  return (
    <div className={styles.container}>
      <h2 className={styles.messagesHeader}>
        {channel.title}
        {
          <ul className={styles.participants}>
            {channel.participation?.map(p => (
              <li key={p.participant['@id']}>
                <PersonMini webId={p.participant['@id']} size={1} />
              </li>
            ))}
          </ul>
        }
      </h2>

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
            const notEnoughTimeElapsed =
              i > 0 &&
              new Date(msg.created).getTime() -
                new Date(messages[i - 1]!.created).getTime() <
                5 * 60 * 1000

            const showBadge =
              !isSameDateAsPrevious ||
              !isSameMakerAsPrevious ||
              !notEnoughTimeElapsed
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
                    isUnread={Boolean(msg['@id'] && unread.has(msg['@id']))}
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

      <NewChatConfirmation channelUri={channelUri} />

      {isSavedInTypeIndex && isParticipant && (
        <SendMessageForm
          disabled={!isReady}
          onSendMessage={async ({ message }) => {
            firstLoad.current = true
            await handleSendMessage({ message, channel: channelUri })
          }}
        />
      )}
    </div>
  )
}

const NewChatConfirmation = ({ channelUri }: { channelUri: URI }) => {
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
        .filter(n => n?.target?.['@id'] === channelUri)
        .flatMap(n => graphOf(n, 'object')) ?? [],
    [
      notificationResults.quads,
      notificationResults.variables.messageNotification,
      channelUri,
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
    !typeIndexChatResults.variables.instance?.includes(channelUri)

  const handleContinue = async () => {
    // add self as participant to chat
    await addParticipantMutation.mutateAsync({
      channel: channelUri,
      participant: auth.webId!,
    })

    // save chat to private type index
    await saveToPrivateTypeIndex.mutateAsync({
      index: privateTypeIndex!,
      type: meeting.LongChat,
      location: channelUri,
    })
    // delete related notifications from inbox
    // for (const n of channelNotifications!) {
    //   await deleteNotification.mutateAsync({ uri: n.value })
    // }
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
