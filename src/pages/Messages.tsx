import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import classNames from 'classnames'
import { Button, Loading } from 'components'
import { useAuth } from 'hooks/useAuth'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import styles from './Messages.module.scss'

export const Messages = () => {
  const personId = useParams().id as string
  const auth = useAuth()

  const { data: person } = comunicaApi.endpoints.readPerson.useQuery({
    webId: personId,
  })
  const { data: messages } = comunicaApi.endpoints.readMessages.useQuery(
    auth.webId ? { userId: personId, me: auth.webId } : skipToken,
  )

  const [createMessage] = comunicaApi.endpoints.createMessage.useMutation()

  const { register, handleSubmit } = useForm<{ message: string }>()

  const handleFormSubmit = handleSubmit(async data => {
    if (!auth.webId) throw new Error('No authenticated user available')
    await createMessage({
      senderId: auth.webId,
      receiverId: personId,
      message: data.message,
    })
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
            </span>
          </div>
        )) ?? (
          <div>
            <Loading>Loading previous messages</Loading>
          </div>
        )}
      </div>
      <form onSubmit={handleFormSubmit}>
        <textarea {...register('message', { required: true })} />
        <Button primary type="submit">
          Send
        </Button>
      </form>
    </div>
  )
}
