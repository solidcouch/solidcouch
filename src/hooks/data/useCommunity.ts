import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { useMemo } from 'react'
import { URI } from 'types'
import { readCommunityMembersQuery, readCommunityQuery } from './queries'

export const useIsMember = (userId: URI, communityId: URI) => {
  const { variables } = useLDhopQuery(
    useMemo(
      () => ({
        query: readCommunityMembersQuery,
        variables: { community: [communityId] },
        fetch,
      }),
      [communityId],
    ),
  )

  return (variables.person ?? []).includes(userId)
}

export const useReadCommunity = (communityId: URI) => {
  const { variables } = useLDhopQuery({
    query: readCommunityQuery,
    variables: useMemo(() => ({ community: [communityId] }), [communityId]),
    fetch,
  })

  return useMemo(
    () => ({ community: communityId, groups: variables.group ?? [] }),
    [communityId, variables.group],
  )
}
