import { HospexCommunityShapeType } from '@/ldo/hospexCommunity.shapeTypes'
import { URI } from '@/types'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset, languagesOf } from '@ldo/ldo'
import { useMemo } from 'react'
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
  const { store, variables, isLoading } = useLDhopQuery({
    query: readCommunityQuery,
    variables: useMemo(() => ({ community: [communityId] }), [communityId]),
    fetch,
  })

  const community = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    variables // this is to keep variables in dependencies - to run this hook when data are fetched, because store remains the same object even when it changes
    const ldoDataset = createLdoDataset(store.getQuads(null, null, null, null))
    const builder = ldoDataset.usingType(HospexCommunityShapeType)
    const ldo = builder.fromSubject(communityId)
    return ldo
  }, [communityId, store, variables])

  const name = useMemo(() => {
    const nameLanguages = languagesOf(community, 'name')

    const english = [...(nameLanguages['en']?.values() ?? [])][0]
    const none = [...(nameLanguages['@none']?.values() ?? [])][0]

    return english || none
  }, [community])

  const pun = useMemo(() => {
    const punLanguages = languagesOf(community, 'note')

    const english = [...(punLanguages['en']?.values() ?? [])][0]
    const none = [...(punLanguages['@none']?.values() ?? [])][0]

    return english || none
  }, [community])

  const about = useMemo(() => {
    const aboutLanguages = languagesOf(community, 'about')

    const english = [...(aboutLanguages['en']?.values() ?? [])][0]
    const none = [...(aboutLanguages['@none']?.values() ?? [])][0]

    return english || none
  }, [community])

  return useMemo(
    () => ({
      community: communityId,
      logo: community.logo?.map(({ '@id': logo }) => logo) ?? [],
      name,
      about,
      pun,
      groups: variables.group ?? [],
      isLoading,
    }),
    [about, community.logo, communityId, isLoading, name, pun, variables.group],
  )
}
