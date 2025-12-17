import { Button, Loading } from '@/components'
import { Person } from '@/components/Person/Person'
import { withToast } from '@/components/withToast.tsx'
import { useConfig } from '@/config/hooks'
import { useCheckSetup } from '@/hooks/data/useCheckSetup'
import {
  useCreateChat,
  useCreateMessage,
  useCreateMessageNotification,
  useProcessNotification,
} from '@/hooks/data/useCreateMessage'
import { useSolidProfile } from '@/hooks/data/useProfile'
import { useReadMessages } from '@/hooks/data/useReadMessages'
import { useAuth } from '@/hooks/useAuth'
import { useSendEmailNotification } from '@/hooks/useSendEmailNotification'
import { URI } from '@/types'
import { getContainer } from '@/utils/helpers'
import { Trans, useLingui } from '@lingui/react/macro'
import clsx from 'clsx'
import { produce } from 'immer'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import styles from './MessagesOld.module.scss'

enum NotificationStatus {
  processing = 'processing',
  processed = 'processed',
  errored = 'errored',
}

export const MessagesOld = () => {
  const { communityId, emailNotificationsService, emailNotificationsType } =
    useConfig()
  const personId = useParams().id as string
  const auth = useAuth()
  const { t } = useLingui()

  const [isSaving, setIsSaving] = useState(false)

  const [messages, fetchingStatus, notificationsFetchingStatus, chats] =
    useReadMessages({
      me: auth.webId ?? '',
      userId: personId,
    })

  const {
    privateTypeIndexes,
    personalHospexDocuments,
    // inboxes: [myInbox],
  } = useCheckSetup(auth.webId ?? '', communityId)

  const [otherPersonSetup] = useSolidProfile(personId)
  const otherInbox = otherPersonSetup?.inbox?.['@id']

  const createMessage = useCreateMessage()
  const createMessageNotification = useCreateMessageNotification()
  const createChat = useCreateChat()
  const sendNotification = useSendEmailNotification({
    from: auth.webId as string,
    to: personId,
    type: 'message',
  })

  const processNotification = useProcessNotification()

  // keep status of notification processing in a dict
  // key will be message uri
  const [notificationStatuses, setNotificationStatuses] = useState<{
    [key: URI]: NotificationStatus
  }>({})

  // process notifications of unread messages
  // and the ref to hack out of double processing of notifications that goes on for some reason
  const notificationsInProcess = useRef<Set<URI>>(new Set())

  useEffect(() => {
    ;(async () => {
      if (messages && auth.webId && chats[0]?.myChat) {
        for (const message of messages) {
          if (
            message.notification && // there is a notification to process
            !(message.id in notificationStatuses) && // notification isn't being processed, yet
            !notificationsInProcess.current.has(message.id)
          ) {
            notificationsInProcess.current.add(message.id)
            setNotificationStatuses(
              produce(draft => {
                draft[message.id] = NotificationStatus.processing
              }),
            )
            try {
              await processNotification({
                notificationId: message.notification,
                chat: chats[0].myChat,
                otherChat: message.chat,
                otherPerson: personId,
              })
              setNotificationStatuses(
                produce(draft => {
                  draft[message.id] = NotificationStatus.processed
                }),
              )
            } catch {
              setNotificationStatuses(
                produce(draft => {
                  draft[message.id] = NotificationStatus.errored
                }),
              )
            }
          }
        }
      }
    })()
  }, [
    auth.webId,
    chats,
    messages,
    notificationStatuses,
    personId,
    processNotification,
  ])

  const otherChatFromNotifications = messages
    .filter(msg => msg.notification)
    .find(msg => !!msg.chat)?.chat

  const { register, handleSubmit, reset } = useForm<{ message: string }>()

  const handleFormSubmit = handleSubmit(async data => {
    if (!auth.webId) throw new Error(t`No authenticated user available`)
    setIsSaving(true)
    if (!otherInbox)
      throw new Error(
        t`Inbox of the other person not found (probably too soon)`,
      )

    let chat: string | undefined = chats[0]?.myChat

    if (!chat) {
      if (!personalHospexDocuments[0])
        throw new Error(t`Hospex not set up (should not happen)`)
      if (!privateTypeIndexes[0])
        throw new Error(t`Private type index not set up (should not happen)`)
      ;({ chatId: chat } = await createChat({
        me: auth.webId,
        otherPerson: personId,
        hospexContainer: getContainer(personalHospexDocuments[0]),
        otherChat:
          chats[0]?.otherChats?.[0] ?? otherChatFromNotifications ?? undefined,
        privateTypeIndex: privateTypeIndexes[0],
      }))
    }

    const { messageId, createdAt } = await withToast(
      createMessage({
        senderId: auth.webId,
        message: data.message,
        chat,
      }),
      {
        pending: t`Creating message`,
        success: t`Message was created`,
      },
    )

    await withToast(
      createMessageNotification({
        inbox: otherInbox,
        senderId: auth.webId,
        messageId,
        chatId: chat,
        updated: createdAt,
        content: data.message,
      }),
      {
        pending: t`Sending Solid notification`,
        success: t`Solid notification was sent`,
      },
    )

    reset({ message: '' })
    setIsSaving(false)

    // send email notification
    if (emailNotificationsService && emailNotificationsType === 'simple') {
      await withToast(sendNotification({ messageId, message: data.message }), {
        pending: t`Sending email notification`,
        success: t`Email notification was sent`,
      })
    }
  })

  const isFormDisabled = isSaving || !otherInbox

  const isInitialConversation =
    !fetchingStatus.isLoading &&
    !notificationsFetchingStatus.isLoading &&
    !chats.some(ch => !!ch.myChat)

  return (
    <div>
      <pre>
        {(fetchingStatus.isLoading ||
          notificationsFetchingStatus.isLoading) && <Trans>Loading...</Trans>}
      </pre>
      <Trans>
        Messages with <Person webId={personId} link showName />
      </Trans>
      <div className={styles.messages}>
        {messages?.map(({ id, message, from, createdAt, status }, i) => (
          <div
            key={id}
            className={clsx(
              styles.message,
              from === auth.webId && styles.fromMe,
              status === 'unread' && styles.unread,
            )}
            data-cy="message"
            data-cy-message-from={from === auth.webId ? 'me' : 'other'}
          >
            <span
              data-testid={`message${i}-from-${from === auth.webId ? 'me' : 'other'}`}
            >
              {message}
            </span>
            <span
              className={styles.time}
              title={new Date(createdAt).toLocaleString()}
            >
              {new Date(createdAt).toLocaleTimeString()}
              {/* On click of the date, we could show info about the message
              including external link to the particular message
              */}
            </span>
          </div>
        )) ?? (
          <div>
            <Loading>
              <Trans>Loading previous messages</Trans>
            </Loading>
          </div>
        )}
      </div>
      {isInitialConversation && (
        <>
          <Trans>This is a start of your conversation</Trans>
          {/* {' '}<Button secondary>Ignore (not implemented)</Button> */}
        </>
      )}
      <form onSubmit={handleFormSubmit} className={styles.messageForm}>
        <fieldset disabled={isFormDisabled}>
          <textarea {...register('message', { required: true })} />
          <Button primary type="submit" disabled={isFormDisabled}>
            <Trans>Send</Trans>
          </Button>
        </fieldset>
      </form>
    </div>
  )
}
