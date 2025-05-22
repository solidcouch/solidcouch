import { PersonMini } from '@/components/PersonMini/PersonMini.tsx'
import { getThreadsQuery } from '@/data/queries/chat'
import { useAuth } from '@/hooks/useAuth'
import { ChatShapeShapeType } from '@/ldo/app.shapeTypes'
import { ChatShape } from '@/ldo/app.typings'
import { type Thread } from '@/types'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { Trans, useLingui } from '@lingui/react/macro'
import clsx from 'clsx'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
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

  const channelUris = threadsResults.variables.channel ?? []
  const inboxChannelUris = threadsResults.variables.chat ?? []
  const connectedChannelUris = threadsResults.variables.instance ?? []

  const dataset = createLdoDataset(threadsResults.quads)

  const threads = channelUris.map(uri =>
    dataset.usingType(ChatShapeShapeType).fromSubject(uri),
  )

  return (
    <div>
      <h1>
        <Trans>Conversations</Trans>
      </h1>
      <ul className={styles.threadList}>
        {threads.map(thread => {
          const unread = inboxChannelUris?.includes(thread['@id']!)
          const disconnected = !connectedChannelUris?.includes(thread['@id']!)
          return (
            <li key={thread['@id']} data-cy="thread-list-item">
              <Thread
                thread={thread}
                unread={unread}
                disconnected={disconnected}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const Thread = ({
  thread,
  unread,
  disconnected,
}: {
  thread: ChatShape
  unread?: boolean
  disconnected?: boolean
}) => {
  const { t } = useLingui()
  const auth = useAuth()
  const others =
    thread.participation?.filter(p => p.participant['@id'] !== auth.webId) ?? []

  const [profiles] = useProfiles(others.map(o => o.participant['@id']))

  const msg = thread.message2?.toArray() ?? []
  const msgLegacy = thread.message?.toArray() ?? []

  const lastMessage = msg
    .concat(msgLegacy)
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
        className={clsx(
          styles.thread,
          (unread || disconnected) && styles.unread,
        )}
        data-cy={(unread || disconnected) && 'thread-unread'}
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
