import { useMessages } from 'hooks/data/useRdfQuery'
import { useAuth } from 'hooks/useAuth'

export const MyGuests = () => {
  const auth = useAuth()
  const res = useMessages({
    me: auth.webId ?? '',
    userId: 'https://grouptest1.solidcommunity.net/profile/card#me',
  })
  return (
    <>
      <pre>{JSON.stringify(res, null, 2)}</pre>MyGuests
    </>
  )
}
