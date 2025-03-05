import { URI } from '@/types'
import { hospex, sioc } from '@/utils/rdf-namespaces'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { privateProfileAndHospexDocumentQuery } from './queries'
import { QueryKey } from './types'
import { useIsMember } from './useCommunity'

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
  const { isLoading, variables, store } = useLDhopQuery({
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

  const publicTypeIndexes = variables.publicTypeIndex ?? []
  const privateTypeIndexes = variables.privateTypeIndex ?? []
  const preferencesFiles = variables.preferencesFile ?? []
  const inboxes = variables.inbox ?? []

  const personalHospexDocumentsForCommunity =
    variables.hospexDocumentForCommunity ?? []

  const hospexDocuments = useMemo(
    () =>
      (variables.hospexDocument ?? [])
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
            hospexDocument: hd,
            communities,
            storage: hospexContainers[0]?.value,
          }
        }),
    [store, userId, variables],
  )

  const isHospexProfile =
    personalHospexDocumentsForCommunity.length > 0
      ? true
      : isLoading
        ? undefined
        : false
  const isPublicTypeIndex =
    publicTypeIndexes.length > 0 ? true : isLoading ? undefined : false
  const isPrivateTypeIndex =
    privateTypeIndexes.length > 0 ? true : isLoading ? undefined : false
  const isPreferencesFile =
    preferencesFiles.length > 0 ? true : isLoading ? undefined : false
  const isInbox = inboxes.length > 0 ? true : isLoading ? undefined : false
  return {
    isHospexProfile,
    isPublicTypeIndex,
    isPrivateTypeIndex,
    isPreferencesFile,
    isInbox,
    personalHospexDocuments: personalHospexDocumentsForCommunity,
    publicTypeIndexes,
    privateTypeIndexes,
    preferencesFiles,
    inboxes,
    allHospex: hospexDocuments,
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
