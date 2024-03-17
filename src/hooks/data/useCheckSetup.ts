import { fetch } from '@inrupt/solid-client-authn-browser'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { URI } from 'types'
import { hospexDocumentQuery, personInbox } from './queries'
import { useIsMember } from './useCommunity'
import { useLDhopQuery } from './useLDhopQuery'

const hospexDocumentQueryWithInbox = hospexDocumentQuery.concat([personInbox])

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
    () => ({ isMember, ...hospexDocumentSetup } as const),
    [hospexDocumentSetup, isMember],
  )
}

export const useHospexDocumentSetup = (userId: URI, communityId: URI) => {
  const { isLoading, variables } = useLDhopQuery({
    query: hospexDocumentQueryWithInbox,
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
  const inboxes = variables.inbox ?? []

  const personalHospexDocumentsForCommunity =
    variables.hospexDocumentForCommunity ?? []

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
  const isInbox = inboxes.length > 0 ? true : isLoading ? undefined : false
  return {
    isHospexProfile,
    isPublicTypeIndex,
    isPrivateTypeIndex,
    isInbox,
    personalHospexDocuments: personalHospexDocumentsForCommunity,
    publicTypeIndexes,
    privateTypeIndexes,
    inboxes,
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
  >({ queryKey: ['mailerIntegration'], queryFn: checkMailerIntegration })

  if (data === 'mailer not set up') return true

  if (isLoading || !data) return undefined
  const integrations = data.integrations.filter(i => i.object === inbox)

  if (integrations.length === 0) return false
  else if (integrations.some(i => i.verified)) return true
  else return 'unverified' as const
}

export const useCheckSimpleEmailNotifications = (
  webId: URI,
  mailer: string,
) => {
  const checkMailerIntegration = useCallback(async () => {
    if (!mailer) return 'mailer not set up'

    const response = await fetch(
      `${mailer}/status/${encodeURIComponent(webId)}`,
    )

    if (response.status === 403) return { emailVerified: false }
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  }, [mailer, webId])

  const { isLoading, data } = useQuery<
    { emailVerified: boolean } | 'mailer not set up'
  >({ queryKey: ['simpleMailerIntegration'], queryFn: checkMailerIntegration })

  if (data === 'mailer not set up') return true

  if (isLoading || !data) return undefined

  return data.emailVerified
}
