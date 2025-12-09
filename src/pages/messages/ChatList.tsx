import { PersonMini } from '@/components/PersonMini/PersonMini'
import { threadsQuery } from '@/data/queries/chat'
import { useAuth } from '@/hooks/useAuth'
import { ChatShapeShapeType } from '@/ldo/app.shapeTypes'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { useMemo } from 'react'
import { FaCircle, FaExclamation } from 'react-icons/fa'
import { Link } from 'react-router'
import strict_uri_encode from 'strict-uri-encode'
import styles from './ChatList.module.scss'

export const ChatList = () => {
  const auth = useAuth()

  const threadsResults = useLDhopQuery(
    useMemo(
      () => ({
        query: threadsQuery,
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
    <nav>
      <ul className={styles.chatList}>
        {threads.map(thread => {
          const unread = inboxChannelUris?.includes(thread['@id']!)
          const disconnected = !connectedChannelUris?.includes(thread['@id']!)
          if (!thread['@id']) return null
          return (
            <li
              key={thread['@id']}
              data-cy="thread-list-item"
              className={styles.chatItem}
            >
              <Link to={`/messages/${strict_uri_encode(thread['@id'])}`}>
                {thread.participation
                  ?.filter(p => p.participant['@id'] !== auth.webId)
                  .map(p => (
                    <PersonMini
                      webId={p.participant['@id']}
                      key={p.participant['@id']}
                    />
                  ))}
                {unread && <FaCircle />}
                {disconnected && <FaExclamation />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
