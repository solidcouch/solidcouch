import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import classNames from 'classnames'
import { Button, Loading } from 'components'
import { ExternalIconLink } from 'components/Button/Button'
import { useAuth } from 'hooks/useAuth'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { URI } from 'types'
import styles from './Messages.module.scss'

export const Messages = () => {
  const personId = useParams().id as string
  const auth = useAuth()

  const [isSaving, setIsSaving] = useState(false)

  const { data: person } = comunicaApi.endpoints.readPerson.useQuery({
    webId: personId,
  })
  const { data: messages } = comunicaApi.endpoints.readMessages.useQuery(
    auth.webId ? { userId: personId, me: auth.webId } : skipToken,
  )

  const [createMessage] = comunicaApi.endpoints.createMessage.useMutation()
  const [processNotification] =
    comunicaApi.endpoints.processNotification.useMutation()

  // keep status of notification processing in a dict
  // key will be message uri
  const [notificationStatuses, setNotificationStatuses] = useState<{
    [key: URI]: 'processing' | 'processed' | 'errored'
  }>({})

  // process notifications of unread messages
  // and the ref to hack out of double running in strict mode
  const isFirstRun = useRef(false)
  useEffect(() => {
    ;(async () => {
      if (messages && auth.webId && !isFirstRun.current) {
        isFirstRun.current = true
        for (const message of messages) {
          if (
            message.notification && // there is a notification to process
            !(message.id in notificationStatuses) // notification isn't being processed, yet
          ) {
            setNotificationStatuses(statuses => ({
              ...statuses,
              [message.id]: 'processing',
            }))
            try {
              await processNotification({
                id: message.notification,
                me: auth.webId,
                other: personId,
              }).unwrap()
              setNotificationStatuses(statuses => ({
                ...statuses,
                [message.id]: 'processed',
              }))
            } catch (err) {
              setNotificationStatuses(statuses => ({
                ...statuses,
                [message.id]: 'errored',
              }))
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
      Messages with {person?.name} <ExternalIconLink href={personId} />
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
