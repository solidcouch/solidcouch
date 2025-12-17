import { Person } from '@/components/Person/Person'
import { threadsQuery } from '@/data/queries/chat'
import { useReadAccesses } from '@/hooks/data/access'
import { AccessMode } from '@/hooks/data/types'
import { useAuth } from '@/hooks/useAuth'
import { ChatShapeType } from '@/ldo/app.shapeTypes'
import { getContainer } from '@/utils/helpers'
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

  const channelUris = useMemo(
    () => threadsResults.variables.channel ?? [],
    [threadsResults.variables.channel],
  )
  const inboxChannelUris = threadsResults.variables.chat ?? []
  const connectedChannelUris = threadsResults.variables.instance ?? []

  const dataset = createLdoDataset(threadsResults.quads)

  const chats = useMemo(
    () =>
      channelUris
        .map(uri => {
          const chat = dataset.usingType(ChatShapeType).fromSubject(uri)
          // Pre-calculate the latest timestamp once
          const timestamps = [
            chat.message
              ? [...chat.message].map(m => new Date(m.created).getTime())
              : [],
          ].flat()
          const latestActivity = Math.max(...timestamps)

          return { chat, latestActivity }
        })
        .sort((a, b) => b.latestActivity - a.latestActivity) // Descending
        .map(item => item.chat),
    [channelUris, dataset],
  ) // Extract original object

  const chatAccesses = useReadAccesses(
    useMemo(() => chats.map(ch => getContainer(ch['@id']!)), [chats]),
  )

  const accessParticipantsFromAcl = useMemo(() => {
    const agents = chatAccesses.results.map(a =>
      getAgentsWithModes(a!, [AccessMode.Write, AccessMode.Append]),
    )
    return agents
  }, [chatAccesses.results])

  return (
    <nav>
      <ul className={styles.chatList}>
        {chats.map((chat, i) => {
          const unread = inboxChannelUris?.includes(chat['@id']!)
          const disconnected = !connectedChannelUris?.includes(chat['@id']!)
          const explicitParticipants =
            chat.participation?.map(p => p.participant['@id']) ?? []
          const aclParticipants = accessParticipantsFromAcl[i] ?? []

          const participants = new Set([
            ...explicitParticipants,
            ...aclParticipants,
          ])
          const otherParticipants = [...participants].filter(
            p => p !== auth.webId,
          )
          if (!chat['@id']) return null
          return (
            <li
              key={chat['@id']}
              data-cy="thread-list-item"
              className={styles.chatItem}
            >
              <Link to={`/messages/${strict_uri_encode(chat['@id'])}`}>
                {otherParticipants.map(participant => (
                  <Person webId={participant} key={participant} size={1.25} />
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

interface AccessBlock {
  url?: string
  modes: AccessMode[]
  agents: string[]
  agentClasses: string[]
  agentGroups: string[]
  defaults: string[]
}

interface AclFile {
  accesses?: AccessBlock[]
}

interface AccessControlData {
  acls: AclFile[]
}

/**
 * Extracts unique agents that possess ANY of the specified access modes.
 *
 * @param data - The AccessControlData object.
 * @param targetModes - An array of modes to check for (e.g., ['Read', 'Write']).
 * @returns An array of unique agent URIs.
 */
function getAgentsWithModes(
  data: AccessControlData,
  targetModes: AccessMode[],
): string[] {
  // Use a Set to automatically handle deduplication of agents
  const foundAgents = new Set<string>()

  // Use a Set for targetModes for O(1) lookup complexity if the list is long,
  // though for simple permissions an array.includes is negligible.
  const targetModeSet = new Set(targetModes)

  // Iterate safely through the structure
  data.acls?.forEach(acl => {
    acl.accesses?.forEach(access => {
      // Check if the current access block contains ANY of the target modes
      const hasMatchingMode = access.modes.some(mode => targetModeSet.has(mode))

      if (hasMatchingMode) {
        access.agents.forEach(agent => {
          foundAgents.add(agent)
        })
      }
    })
  })

  return Array.from(foundAgents)
}
