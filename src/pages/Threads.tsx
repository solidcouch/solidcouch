import { skipToken } from '@reduxjs/toolkit/dist/query'
import { ldoApi } from 'app/services/ldoApi'
import classNames from 'classnames'
import { Loading } from 'components'
import { PersonMini } from 'components/PersonMini/PersonMini'
import { useReadThreads } from 'hooks/data/useReadThreads'
import { useAuth } from 'hooks/useAuth'
import { Link } from 'react-router-dom'
import { Thread as ThreadType } from 'types'
import styles from './Threads.module.scss'

export const Threads = () => {
  const auth = useAuth()

  // const { data: threads, error } = comunicaApi.endpoints.readThreads.useQuery(
  //   auth.webId ? { me: auth.webId } : skipToken,
  // )

  const threads = useReadThreads(auth.webId ?? '')

  // if (error) return <>{JSON.stringify(error, null, 2)}</>
  if (!threads) return <Loading>Loading...</Loading>

  return (
    <div>
      <h1>Conversations</h1>
      <ul className={styles.threadList}>
        {threads.map(thread => {
          const other = thread.participants.find(p => p !== auth.webId)
          return (
            <li key={thread.id}>
              <Link to={`/messages/${encodeURIComponent(other ?? '')}`}>
                <Thread thread={thread} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const Thread = ({ thread }: { thread: ThreadType }) => {
  const auth = useAuth()
  const other = thread.participants.find(p => p !== auth.webId)
  const { data: person } = ldoApi.endpoints.readUser.useQuery(
    other || skipToken,
  )
  const lastMessage = thread.messages[thread.messages.length - 1]
  return (
    <div className={classNames(styles.thread, thread.status && styles.unread)}>
      <PersonMini webId={other ?? ''} className={styles.avatar} />
      <div>
        <div className={styles.name} title={person?.['@id']}>
          {person?.name}
        </div>
        <div className={styles.content} title={lastMessage?.message}>
          {lastMessage?.message}
        </div>
      </div>
    </div>
  )
}
