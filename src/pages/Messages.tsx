import { comunicaApi } from 'app/services/comunicaApi'
import classNames from 'classnames'
import { Button, Loading } from 'components'
import { PersonBadge } from 'components/PersonBadge/PersonBadge'
import { useReadMessages } from 'hooks/data/useReadMessages'
import { useAuth } from 'hooks/useAuth'
import { produce } from 'immer'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { URI } from 'types'
import styles from './Messages.module.scss'

export const Messages = () => {
  const personId = useParams().id as string
  const auth = useAuth()

  const [isSaving, setIsSaving] = useState(false)

  const [messages, fetchingStatus] = useReadMessages({
    me: auth.webId ?? '',
    userId: personId,
  })

  const [createMessage] = comunicaApi.endpoints.createMessage.useMutation()
  const [processNotification] =
    comunicaApi.endpoints.processNotification.useMutation()

  // keep status of notification processing in a dict
  // key will be message uri
  const [notificationStatuses, setNotificationStatuses] = useState<{
    [key: URI]: 'processing' | 'processed' | 'errored'
  }>({})

  // process notifications of unread messages
  // and the ref to hack out of double processing of notifications that goes on for some reason
  const notificationsInProcess = useRef<Set<URI>>(new Set())

  useEffect(() => {
    ;(async () => {
      if (messages && auth.webId) {
        for (const message of messages) {
          if (
            message.notification && // there is a notification to process
            !(message.id in notificationStatuses) && // notification isn't being processed, yet
            !notificationsInProcess.current.has(message.id)
          ) {
            notificationsInProcess.current.add(message.id)
            setNotificationStatuses(
              produce(draft => {
                draft[message.id] = 'processing'
              }),
            )
            try {
              await processNotification({
                id: message.notification,
                me: auth.webId,
                other: personId,
              }).unwrap()
              setNotificationStatuses(
                produce(draft => {
                  draft[message.id] = 'processed'
                }),
              )
            } catch (err) {
              setNotificationStatuses(
                produce(draft => {
                  draft[message.id] = 'errored'
                }),
              )
            }
          }
        }
      }
    })()
  }, [
    auth.webId,
    messages,
    notificationStatuses,
    personId,
    processNotification,
  ])

  const { register, handleSubmit, reset } = useForm<{ message: string }>()

  const handleFormSubmit = handleSubmit(async data => {
    if (!auth.webId) throw new Error('No authenticated user available')
    setIsSaving(true)
    await createMessage({
      senderId: auth.webId,
      receiverId: personId,
      message: data.message,
    }).unwrap()
    reset({ message: '' })
    setIsSaving(false)
  })

  return (
    <div>
      <pre>{fetchingStatus.isLoading && 'Loading'}</pre>
      Messages with <PersonBadge webId={personId} link />
      <div className={styles.messages}>
        {messages?.map(({ id, message, from, createdAt, status }) => (
          <div
            key={id}
            className={classNames(
              styles.message,
              from === auth.webId && styles.fromMe,
              status === 'unread' && styles.unread,
            )}
          >
            {message}{' '}
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
            <Loading>Loading previous messages</Loading>
          </div>
        )}
      </div>
      <form onSubmit={handleFormSubmit} className={styles.messageForm}>
        <fieldset disabled={isSaving}>
          <textarea {...register('message', { required: true })} />
          <Button primary type="submit" disabled={isSaving}>
            Send
          </Button>
        </fieldset>
      </form>
    </div>
  )
}
