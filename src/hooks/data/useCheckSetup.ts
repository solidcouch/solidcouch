import { URI } from '@/types'
import { hospex } from '@/utils/rdf-namespaces'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLdhopQuery } from '@ldhop/react'
import { useQuery } from '@tanstack/react-query'
import { sioc } from 'rdf-namespaces'
import { useCallback, useMemo } from 'react'
import encodeURIComponent from 'strict-uri-encode'
import { useReadAccesses } from './access'
import { privateProfileAndHospexDocumentQuery } from './queries/hospex'
import { publicWebIdProfileQuery, webIdProfileQuery } from './queries/profile'
import { QueryKey } from './types'
import { useIsMember } from './useCommunity'

/**
 * Full setup check
 *
 * - we can find storage
 * - solid pod has WAC support
 * - solid inbox
 *    - exists
 *    - linked from webId document
 *    - appendable by public or by authenticated agent, or by community members
 *    - current user control, read, write
 *    - someday/maybe: link it from hospex profile, and allow only community members to append
 * - preferences file
 *    - exists
 *    - is linked from webId profile
 *    - current user can read, write, control
 * - public type index
 *    - is linked from webId document
 *    - exists
 *    - is publicly readable
 *    - current user can read, write, control
 * - private type index
 *    - is linked from preferences file
 *    - exists
 *    - current user can read, write, control
 * - join a community
 *    - should be in one of the community's vcard:Group lists
 * - hospex storage
 *    - linked from public type index
 *    - exists
 *    - read access allowed to community's vcard:Group lists
 *    - also get other community storages
 * - email notifications
 *    - VC proving ownership of email address, issued by a trusted authority
 *    - a default or preferred email notification service has read access to the VC
 */

export const usePublicTypeIndex = (webId: string) => {
  const { isLoading, variables } = useLdhopQuery(
    useMemo(
      () => ({
        query: publicWebIdProfileQuery,
        variables: { person: [webId] },
        fetch,
      }),
      [webId],
    ),
  )

  const typeIndexArray = useMemo(
    () => Array.from(variables.publicTypeIndex).map(t => t.value),
    [variables.publicTypeIndex],
  )

  const accesses = useReadAccesses(typeIndexArray)

  const accessMap = useMemo(
    () => new Map(typeIndexArray.map((uri, i) => [uri, accesses.results[i]!])),
    [accesses.results, typeIndexArray],
  )

  return {
    isLoading,
    publicTypeIndex: variables.publicTypeIndex,
    access: accessMap,
  }
}

export const usePrivateTypeIndex = (webId: string) => {
  const { isLoading, variables } = useLdhopQuery(
    useMemo(
      () => ({
        query: webIdProfileQuery,
        variables: { person: [webId] },
        fetch,
      }),
      [webId],
    ),
  )

  const typeIndexArray = useMemo(
    () => Array.from(variables.privateTypeIndex).map(t => t.value),
    [variables.privateTypeIndex],
  )

  const accesses = useReadAccesses(typeIndexArray)

  const accessMap = useMemo(
    () => new Map(typeIndexArray.map((uri, i) => [uri, accesses.results[i]!])),
    [accesses.results, typeIndexArray],
  )

  return {
    isLoading,
    privateTypeIndex: variables.privateTypeIndex,
    access: accessMap,
  }
}

export const useInbox = (webId: string) => {
  const { isLoading, variables } = useLdhopQuery(
    useMemo(
      () => ({
        query: webIdProfileQuery,
        variables: { person: [webId] },
        fetch,
      }),
      [webId],
    ),
  )

  const inboxArray = useMemo(
    () => Array.from(variables.inbox).map(t => t.value),
    [variables.inbox],
  )

  const accesses = useReadAccesses(inboxArray)

  const accessMap = useMemo(
    () => new Map(inboxArray.map((uri, i) => [uri, accesses.results[i]!])),
    [accesses.results, inboxArray],
  )

  return {
    isLoading,
    inbox: variables.inbox,
    access: accessMap,
  }
}

const usePreferencesFile = (webId: string) => {
  const { isLoading, variables } = useLdhopQuery(
    useMemo(
      () => ({
        query: webIdProfileQuery,
        variables: { person: [webId] },
        fetch,
      }),
      [webId],
    ),
  )

  const preferencesFileArray = useMemo(
    () => Array.from(variables.preferencesFile).map(t => t.value),
    [variables.preferencesFile],
  )

  const accesses = useReadAccesses(preferencesFileArray)

  const accessMap = useMemo(
    () =>
      new Map(
        preferencesFileArray.map((uri, i) => [uri, accesses.results[i]!]),
      ),
    [accesses.results, preferencesFileArray],
  )

  return {
    isLoading,
    preferencesFile: variables.preferencesFile,
    access: accessMap,
  }
}

const useHospexDocument = (userId: URI, communityId: URI) => {
  const { isLoading, variables, store } = useLdhopQuery({
    query: privateProfileAndHospexDocumentQuery,
    variables: useMemo(
      () => ({
        person: [userId],
        community: [communityId],
      }),
      [communityId, userId],
    ),
    fetch,
  })

  const hospexDocuments = useMemo(
    () =>
      Array.from(variables.hospexDocument)
        // TODO we'll want more info here, like community name, maybe description, etc
        .map(hd => {
          const communities = store
            .getObjects(userId, sioc.member_of, hd)
            .map(({ value }) => ({
              uri: value,
              // TODO handle with language
              name: store.getObjects(value, sioc.name, null)[0]?.value ?? '',
            }))
          const hospexContainers = store.getObjects(userId, hospex.storage, hd)

          return {
            hospexDocument: hd.value,
            communities,
            storage: hospexContainers[0]?.value,
          }
        }),
    [store, userId, variables],
  )

  return useMemo(
    () => ({
      isLoading,
      forCommunity: variables.hospexDocumentForCommunity,
      all: hospexDocuments,
    }),
    [hospexDocuments, isLoading, variables.hospexDocumentForCommunity],
  )
}
/**
 * Check that
 * public type index exists
 * private type index exists
 * personal hospex document exists
 * community is joined
 */
export const useCheckSetup = (userId: URI, communityId: URI) => {
  const isMember = useIsMember(userId, communityId)
  const hospexDocumentSetup = useHospexDocumentSetup(userId, communityId)
  return useMemo(
    () => ({ isMember, ...hospexDocumentSetup }) as const,
    [hospexDocumentSetup, isMember],
  )
}

export const useHospexDocumentSetup = (userId: URI, communityId: URI) => {
  const publicTypeIndexResults = usePublicTypeIndex(userId)
  const privateTypeIndexResults = usePrivateTypeIndex(userId)
  const inboxResults = useInbox(userId)
  const preferencesFileResults = usePreferencesFile(userId)
  const hospexDocumentResults = useHospexDocument(userId, communityId)

  const isHospexProfile =
    hospexDocumentResults.forCommunity.size > 0
      ? true
      : hospexDocumentResults.isLoading
        ? undefined
        : false
  const isPublicTypeIndex =
    publicTypeIndexResults.publicTypeIndex.size > 0
      ? true
      : publicTypeIndexResults.isLoading
        ? undefined
        : false
  const isPrivateTypeIndex =
    privateTypeIndexResults.privateTypeIndex.size > 0
      ? true
      : privateTypeIndexResults.isLoading
        ? undefined
        : false
  const isPreferencesFile =
    preferencesFileResults.preferencesFile.size > 0
      ? true
      : preferencesFileResults.isLoading
        ? undefined
        : false
  const isInbox =
    inboxResults.inbox.size > 0
      ? true
      : inboxResults.isLoading
        ? undefined
        : false
  return {
    isHospexProfile,
    isPublicTypeIndex,
    isPrivateTypeIndex,
    isPreferencesFile,
    isInbox,
    personalHospexDocuments: hospexDocumentResults.forCommunity,
    publicTypeIndexes: publicTypeIndexResults.publicTypeIndex,
    privateTypeIndexes: privateTypeIndexResults.privateTypeIndex,
    preferencesFiles: preferencesFileResults.preferencesFile,
    inboxes: inboxResults.inbox,
    allHospex: hospexDocumentResults.all,
  } as const
}

export const useCheckEmailNotifications = (inbox: URI, mailer: string) => {
  const checkMailerIntegration = useCallback(async () => {
    if (!mailer) return 'mailer not set up'

    const response = await fetch(`${mailer}/status`)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  }, [mailer])

  const { isLoading, data } = useQuery<
    | {
        integrations: { object: URI; target: URI; verified: boolean }[]
      }
    | 'mailer not set up'
  >({ queryKey: [QueryKey.mailerIntegration], queryFn: checkMailerIntegration })

  if (data === 'mailer not set up') return 'unset' as const

  if (isLoading || !data) return undefined
  const integrations = data.integrations.filter(i => i.object === inbox)

  if (integrations.length === 0) return false
  else if (integrations.some(i => i.verified)) return true
  else return 'unverified' as const
}

const checkMailerIntegration = async (webId: string, mailer: string) => {
  if (!mailer) return 'mailer not set up'

  const response = await fetch(`${mailer}/status/${encodeURIComponent(webId)}`)

  if (response.status === 403) return { emailVerified: false }
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  return response.json()
}

export const useCheckNotificationsQuery = (webId: URI, mailer: string) =>
  useQuery<{ emailVerified: boolean } | 'mailer not set up'>({
    queryKey: [QueryKey.simpleMailerIntegration],
    queryFn: () => checkMailerIntegration(webId, mailer),
  })

export const useCheckSimpleEmailNotifications = (
  webId: URI,
  mailer: string,
) => {
  const { isLoading, data } = useCheckNotificationsQuery(webId, mailer)

  if (data === 'mailer not set up') return 'unset' as const

  if (isLoading || !data) return undefined

  return data.emailVerified
}
