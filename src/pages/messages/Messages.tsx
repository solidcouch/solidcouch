import { Button, ButtonLink } from '@/components'
import { Person } from '@/components/Person/Person'
import {
  getChatLegacyLinkQuery,
  getChatMessagesQuery,
  getChatParticipantsQuery,
  getTypeIndexChatQuery,
  Variables,
} from '@/data/queries/chat'
import { useReadAccesses } from '@/hooks/data/access'
import { addParticipant } from '@/hooks/data/mutations/chat'
import { inboxMessagesQuery } from '@/hooks/data/queries'
import { QueryKey } from '@/hooks/data/types'
import { useSolidProfile } from '@/hooks/data/useProfile'
import { useDeleteRdfDocument } from '@/hooks/data/useRdfDocument'
import { saveTypeRegistration } from '@/hooks/data/useSetupHospex'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { ChatShapeType, MessageActivityShapeType } from '@/ldo/app.shapeTypes'
import { URI } from '@/types'
import {
  EffectiveAccessMode,
  getContainer,
  removeHashFromURI,
} from '@/utils/helpers'
import { meeting_extra } from '@/utils/rdf-namespaces'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { LdhopQuery } from '@ldhop/core'
import { useLdhopQuery } from '@ldhop/react'
import { createLdoDataset, graphOf } from '@ldo/ldo'
import { Trans } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useParams } from 'react-router'
import { Message } from './Message'
import styles from './Messages.module.scss'
import { SendMessageForm } from './SendMessageForm'
import { useSendMessage } from './useSendMessage'

const chatQuery: LdhopQuery<Variables | '?participation' | '?participant'> = [
  ...getChatMessagesQuery(Variables),
  ...getChatParticipantsQuery(Variables),
  ...getChatLegacyLinkQuery(Variables),
]

/**
 * There is also a legacy format for the chat. This old format references other parts of the chat elsewhere. TODO we could render that differently, read-only.
 */

export const MessagesPage = () => {
  const channel = useParams().channel

  const channelUri = useMemo(() => {
    try {
      new URL(channel!)
      return channel
    } catch {
      return undefined
    }
  }, [channel])

  if (!channelUri) return <Trans>"{channel}" is not a valid chat channel</Trans>

  return <Messages channelUri={channelUri} />
}

const Messages = ({ channelUri }: { channelUri: URI }) => {
  const auth = useAuth()
  const locale = useLocale()
  const firstLoad = useRef(true)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useLdhopQuery(
    useMemo(
      () => ({
        query: chatQuery,
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
        .usingType(ChatShapeType)
        .fromSubject(channelUri),
    [channelUri, results.quads],
  )

  const isLegacy = channel.participation?.some(p => p.references?.size ?? 0 > 0)
  // || (channel.message?.size ?? 0) > 0

  const notificationResults = useLdhopQuery(
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
      Array.from(notificationResults.variables.messageNotification)
        .map(msgn =>
          createLdoDataset(notificationResults.quads)
            .usingType(MessageActivityShapeType)
            .fromSubject(msgn.value),
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
    if (!results.isMissing && !results.isLoading && channel.message?.size) {
      listRef.current.scrollTop = listRef.current.scrollHeight
      firstLoad.current = false
    }
  }, [channel.message?.size, results.isLoading, results.isMissing])

  const typeIndexChatResults = useLdhopQuery(
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
  const isSavedInTypeIndex = Array.from(
    typeIndexChatResults.variables.instance,
  ).some(term => term.value === channelUri)
  // is the url a chat channel?
  const isChat = channel.type?.some(t => t['@id'] === 'LongChat')
  // am i a participant?
  const isParticipant =
    isChat &&
    channel.participation?.some(p => p.participant['@id'] === auth.webId)

  const {
    results: [access],
  } = useReadAccesses([channelUri])

  const canRead =
    access?.effectivePermissions?.user?.has(EffectiveAccessMode.read) ||
    access?.effectivePermissions?.public?.has(EffectiveAccessMode.read)
  const canAppend =
    access?.effectivePermissions?.user?.has(EffectiveAccessMode.append) ||
    access?.effectivePermissions?.public?.has(EffectiveAccessMode.append)

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

  const participants = useMemo(
    () => channel.participation?.map(p => p.participant['@id']),
    [channel.participation],
  )
  const otherParticipants = useMemo(
    () => participants?.filter(p => p !== auth.webId),
    [auth.webId, participants],
  )
  const otherParticipantsParams = useMemo(
    // eslint-disable-next-line lingui/no-unlocalized-strings
    () => new URLSearchParams(otherParticipants?.map(p => ['with', p])),
    [otherParticipants],
  )

  const legacyReferencedMessages =
    channel.participation
      ?.map(
        p => p.references?.map(r => Array.from(r.message ?? [])).flat() ?? [],
      )
      .flat() ?? []

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
            {participants?.map(p => (
              <li key={p}>
                <Person webId={p} size="2rem" popover />
              </li>
            ))}
          </ul>
        }
      </h2>

      <ul className={styles.messagesContainer} ref={listRef}>
        {[...(channel.message ?? []), ...legacyReferencedMessages]
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
              <Fragment key={msg['@id']}>
                {!isSameDateAsPrevious && (
                  <li role="separator" className={styles.daySeparator}>
                    {msgDate}
                  </li>
                )}
                <li
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
              </Fragment>
            )
          })}
      </ul>

      <NewChatConfirmation channelUri={channelUri} />

      {isSavedInTypeIndex && isParticipant && canAppend && !isLegacy && (
        <SendMessageForm
          disabled={!isReady}
          onSendMessage={async ({ message }) => {
            firstLoad.current = true
            await handleSendMessage({ message, channel: channelUri })
          }}
        />
      )}

      <div className={styles.info}>
        {!canAppend && canRead && <Trans>You can only read this chat.</Trans>}
        {isLegacy && <Trans>This chat has outdated format.</Trans>}{' '}
        {isLegacy &&
          otherParticipants &&
          (otherParticipants?.length ?? 0) === 1 && (
            <Trans>
              Please{' '}
              <ButtonLink
                secondary
                to={{
                  pathname: '/messages/new',
                  search: otherParticipantsParams.toString(),
                }}
              >
                start a new one
              </ButtonLink>
              .
            </Trans>
          )}
      </div>
    </div>
  )
}

const NewChatConfirmation = ({ channelUri }: { channelUri: URI }) => {
  const auth = useAuth()

  let loading = false

  const [solidProfile, { isLoading }] = useSolidProfile(auth.webId!)
  const privateTypeIndex = solidProfile.privateTypeIndex?.toArray()[0]?.['@id']

  loading ||= isLoading || !privateTypeIndex

  const typeIndexChatResults = useLdhopQuery(
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

  const notificationResults = useLdhopQuery(
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
      Array.from(notificationResults.variables.messageNotification)
        ?.map(msgn =>
          createLdoDataset(notificationResults.quads)
            .usingType(MessageActivityShapeType)
            .fromSubject(msgn.value),
        )
        .filter(n => n?.target?.['@id'] === channelUri)
        .flatMap(n => graphOf(n, 'object')) ?? [],
    [
      channelUri,
      notificationResults.quads,
      notificationResults.variables.messageNotification,
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
    !Array.from(typeIndexChatResults.variables.instance)
      .map(a => a.value)
      ?.includes(channelUri)

  const handleContinue = async () => {
    // add self as participant to chat
    await addParticipantMutation.mutateAsync({
      channel: channelUri,
      participant: auth.webId!,
    })

    // save chat to private type index
    await saveToPrivateTypeIndex.mutateAsync({
      index: privateTypeIndex!,
      type: meeting_extra.LongChat,
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
