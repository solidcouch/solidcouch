import { ButtonLink } from '@/components'
import { Person } from '@/components/Person/Person'
import { threadsQuery } from '@/data/queries/chat'
import { useAuth } from '@/hooks/useAuth'
import { ChatShapeType } from '@/ldo/app.shapeTypes'
import { Chat as ChatShape } from '@/ldo/app.typings'
import { type Thread } from '@/types'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLdhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { Trans, useLingui } from '@lingui/react/macro'
import clsx from 'clsx'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useProfiles } from '../messages/useSendMessage'
import styles from './Threads.module.scss'

export const Threads = () => {
  const auth = useAuth()

  const threadsResults = useLdhopQuery(
    useMemo(
      () => ({
        query: threadsQuery,
        variables: { person: [auth.webId!] },
        fetch,
      }),
      [auth.webId],
    ),
  )

  const [searchParams] = useSearchParams()

  const withPeople = useMemo(() => searchParams.getAll('with'), [searchParams])

  const channelUris = Array.from(threadsResults.variables.channel)
    .filter(term => term.termType === 'NamedNode')
    .map(term => term.value)
  const inboxChannelUris = Array.from(threadsResults.variables.chat)
    .filter(term => term.termType === 'NamedNode')
    .map(term => term.value)
  const connectedChannelUris = Array.from(threadsResults.variables.instance)
    .filter(term => term.termType === 'NamedNode')
    .map(term => term.value)

  const dataset = createLdoDataset(threadsResults.quads)

  const threads = channelUris.map(uri =>
    dataset.usingType(ChatShapeType).fromSubject(uri),
  )

  const filteredThreads = threads.filter(
    t =>
      withPeople.length === 0 ||
      withPeople.every(webId =>
        t.participation?.some(p => p.participant['@id'] === webId),
      ),
  )

  const people = (
    <>
      {withPeople.map(webId => (
        <Person webId={webId} key={webId} showName popover />
      ))}
    </>
  )

  const newSearchParams = useMemo(() => {
    const withParams = searchParams.getAll('with')
    // eslint-disable-next-line lingui/no-unlocalized-strings
    const newParams = new URLSearchParams(withParams.map(w => ['with', w]))
    return newParams
  }, [searchParams])

  return (
    <div>
      <header className={styles.header}>
        <h1>
          {withPeople.length === 0 ? (
            <Trans>Conversations</Trans>
          ) : (
            <>
              <Trans>Conversations with {people}</Trans>
            </>
          )}
        </h1>

        {withPeople.length > 0 && (
          <ButtonLink
            to={{
              pathname: '/messages/new',
              search: newSearchParams.toString(),
            }}
            primary
          >
            <Trans>Start a new conversation</Trans>
          </ButtonLink>
        )}
      </header>
      <ul className={styles.threadList}>
        {filteredThreads.map(thread => {
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

  const msg = thread.message?.toArray() ?? []

  const lastMessage = msg
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
          <Person
            key={profile['@id']}
            webId={profile['@id']}
            size="2.5rem"
            avatarClassName={styles.avatar}
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
