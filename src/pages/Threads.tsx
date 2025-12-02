import { Loading } from '@/components'
import { PersonMini } from '@/components/PersonMini/PersonMini.tsx'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { useReadThreads } from '@/hooks/data/useReadThreads'
import { useAuth } from '@/hooks/useAuth'
import { Thread as ThreadType } from '@/types'
import { Trans, useLingui } from '@lingui/react/macro'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import encodeURIComponent from 'strict-uri-encode'
import styles from './Threads.module.scss'

export const Threads = () => {
  const auth = useAuth()

  const { data: threads } = useReadThreads(auth.webId ?? '')

  if (!threads)
    return (
      <Loading>
        <Trans>Loading...</Trans>
      </Loading>
    )

  return (
    <div>
      <h1>
        <Trans>Conversations</Trans>
      </h1>
      <ul className={styles.threadList}>
        {threads.map(thread => {
          return (
            <li key={thread.id} data-cy="thread-list-item">
              <Thread thread={thread} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const Thread = ({ thread }: { thread: ThreadType }) => {
  const { t } = useLingui()
  const { communityId } = useConfig()
  const auth = useAuth()
  const other = thread.participants.find(p => p !== auth.webId)
  const [person] = useProfile(other ?? '', communityId)
  const lastMessage = thread.messages[thread.messages.length - 1]
  const personLabel = person.name || other
  return (
    <Link
      to={`/messages/${encodeURIComponent(other!)}`}
      aria-label={t`Messages with ${personLabel}`}
    >
      <div
        className={clsx(styles.thread, thread.status && styles.unread)}
        data-cy={thread.status && 'thread-unread'}
      >
        <PersonMini webId={other ?? ''} className={styles.avatar} />
        <div>
          <div className={styles.name} title={person.id}>
            {person.name}
          </div>
          <div className={styles.content} title={lastMessage?.message}>
            {lastMessage?.message}
          </div>
        </div>
      </div>
    </Link>
  )
}
