import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { Loading } from 'components'
import { useAuth } from 'hooks/useAuth'
import { Link } from 'react-router-dom'

export const Threads = () => {
  const auth = useAuth()

  const { data: threads, error } = comunicaApi.endpoints.readThreads.useQuery(
    auth.webId ? { me: auth.webId } : skipToken,
  )

  console.log(threads, error)

  if (error) return <>{JSON.stringify(error, null, 2)}</>
  if (!threads) return <Loading>Loading...</Loading>

  return (
    <div>
      <h1>All messages</h1>
      {threads.map(thread => (
        <div>
          <Link
            to={`/messages/${encodeURIComponent(
              thread.participants.find(p => p !== auth.webId) ?? '',
            )}`}
          >
            {thread.messages[thread.messages.length - 1]?.message}
          </Link>
        </div>
      ))}
    </div>
  )
}
