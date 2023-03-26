import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { Button } from 'components'
import { useAuth } from 'hooks/useAuth'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'

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
    console.log(data)
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
      {messages?.map(({ message, from, to, createdAt }) => (
        <div>{message}</div>
      ))}
      <form onSubmit={handleFormSubmit}>
        <textarea {...register('message', { required: true })} />
        <Button primary type="submit">
          Send
        </Button>
      </form>
    </div>
  )
}
