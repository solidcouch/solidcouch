import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import classNames from 'classnames'
import { Button, Loading } from 'components'
import { useAuth } from 'hooks/useAuth'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
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

  const { register, handleSubmit, reset } = useForm<{ message: string }>()

  const handleFormSubmit = handleSubmit(async data => {
    if (!auth.webId) throw new Error('No authenticated user available')
    setIsSaving(true)
    await createMessage({
      senderId: auth.webId,
      receiverId: personId,
      message: data.message,
    })
    reset({ message: '' })
    setIsSaving(false)
  })

  return (
    <div>
      Messages with {person?.name}
      <div className={styles.messages}>
        {messages?.map(({ id, message, from, createdAt }) => (
          <div
            key={id}
            className={classNames(
              styles.message,
              from === auth.webId && styles.fromMe,
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
      <form onSubmit={handleFormSubmit}>
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
