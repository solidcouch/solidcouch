import { Loading } from '@/components'
import { PersonMini } from '@/components/PersonMini/PersonMini.tsx'
import { getThreadsQuery } from '@/data/queries/chat'
import { useAuth } from '@/hooks/useAuth'
import { ChatShapeShapeType } from '@/ldo/app.shapeTypes'
import { ChatShape } from '@/ldo/app.typings'
import { type Thread } from '@/types'
import { meeting, rdf } from '@/utils/rdf-namespaces'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { Trans, useLingui } from '@lingui/react/macro'
import clsx from 'clsx'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { useProfiles } from '../messages/useSendMessage'
import styles from './Threads.module.scss'

export const Threads = () => {
  const auth = useAuth()

  const threadsResults = useLDhopQuery(
    useMemo(
      () => ({
        query: getThreadsQuery(),
        variables: { person: [auth.webId!] },
        fetch,
      }),
      [auth.webId],
    ),
  )

  const threads = createLdoDataset(threadsResults.quads)
    .usingType(ChatShapeShapeType)
    .matchSubject(rdf.type, meeting.LongChat)

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
            <li key={thread['@id']} data-cy="thread-list-item">
              <Thread thread={thread} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const Thread = ({ thread }: { thread: ChatShape }) => {
  const { t } = useLingui()
  const auth = useAuth()
  const others =
    thread.participation?.filter(p => p.participant['@id'] !== auth.webId) ?? []

  const [profiles] = useProfiles(others.map(o => o.participant['@id']))

  const lastMessage = thread.message2
    ?.toArray()
    .sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
    )
    .pop()
  const personLabel = profiles
    .map(profile => profile.name)
    .filter(a => a)
    .join()
  return (
    <Link
      to={`/messages/${encodeURIComponent(thread['@id']!)}`}
      aria-label={t`Messages with ${personLabel}`}
    >
      <div
        className={clsx(styles.thread /*, thread.status && styles.unread*/)}
        // data-cy={thread.status && 'thread-unread'}
      >
        {profiles.map(profile => (
          <PersonMini
            key={profile['@id']}
            webId={profile['@id']}
            className={styles.avatar}
          />
        ))}
        <div>
          {profiles.map(profile => (
            <div
              className={styles.name}
              title={profile['@id']}
              key={profile['@id']}
            >
              {profile.name}
            </div>
          ))}
          <div className={styles.content} title={lastMessage?.content}>
            {lastMessage?.content}
          </div>
        </div>
      </div>
    </Link>
  )
}
