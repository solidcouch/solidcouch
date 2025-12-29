import { defaultLocale } from '@/config'
import { HospexCommunityShapeType } from '@/ldo/hospexCommunity.shapeTypes'
import { URI } from '@/types'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLdhopQuery, useLDhopQuery } from '@ldhop/react'
import type { ObjectLike } from '@ldo/jsonld-dataset-proxy'
import { createLdoDataset, languagesOf } from '@ldo/ldo'
import { useMemo } from 'react'
import { readCommunityMembersQuery, readCommunityQuery } from './queries'

export const useIsMember = (userId: URI, communityId: URI) => {
  const { variables, isLoading } = useLDhopQuery(
    useMemo(
      () => ({
        query: readCommunityMembersQuery,
        variables: { community: [communityId] },
        fetch,
      }),
      [communityId],
    ),
  )

  if (isLoading) return undefined

  return (variables.person ?? []).includes(userId)
}

export const useReadCommunity = (communityId: URI, ...locales: string[]) => {
  if (locales.length === 0) locales = [...locales, defaultLocale]
  const { store, variables, isLoading } = useLdhopQuery(
    useMemo(
      () => ({
        query: readCommunityQuery,
        variables: { community: new Set([communityId]) },
        fetch,
      }),
      [communityId],
    ),
  )

  const community = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    variables // this is to keep variables in dependencies - to run this hook when data are fetched, because store remains the same object even when it changes
    const ldoDataset = createLdoDataset(store.getQuads(null, null, null, null))
    const builder = ldoDataset.usingType(HospexCommunityShapeType)
    const ldo = builder.fromSubject(communityId)
    return ldo
  }, [communityId, store, variables])

  const name = useLanguage(community, 'name', ...locales)
  const pun = useLanguage(community, 'note', ...locales)
  const about = useLanguage(community, 'about', ...locales)

  return useMemo(
    () => ({
      community: communityId,
      logo: community.logo?.map(({ '@id': logo }) => logo) ?? [],
      name,
      about,
      pun,
      groups: Array.from(variables.group ?? []).map(v => v.value),
      isLoading,
      inbox: Array.from(variables.inbox ?? [])[0]?.value,
    }),
    [
      about,
      community.logo,
      communityId,
      isLoading,
      name,
      pun,
      variables.group,
      variables.inbox,
    ],
  )
}

const useLanguage = <SubjectObject extends ObjectLike>(
  thing: SubjectObject,
  key: keyof SubjectObject,
  ...languages: string[]
) => {
  const allLangs = useMemo(() => [...languages, '@none'], [languages])

  const result = useMemo(() => {
    const resultLanguages = languagesOf(thing, key)

    for (const lang of allLangs) {
      const result = resultLanguages[lang]

      if (typeof result === 'string') return result
      if (result?.toString() === '[object LanguageSet]') {
        const value = Array.from(result)[0]
        if (typeof value === 'string') return value
      }
    }
  }, [allLangs, key, thing])
  return result
}
