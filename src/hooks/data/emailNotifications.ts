import { useConfig } from '@/config/hooks'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import zipWith from 'lodash/zipWith'
import { useMemo } from 'react'
import { useAuth } from '../useAuth'
import { useReadAccesses } from './access'
import { emailVerificationQuery } from './queries/hospex'

export const useReadEmailVerificationSetup = () => {
  const auth = useAuth()
  const { communityId } = useConfig()
  const { variables, isLoading } = useLDhopQuery({
    query: emailVerificationQuery,
    variables: useMemo(
      () => ({
        person: auth.webId ? [auth.webId] : undefined,
        community: [communityId],
      }),
      [auth.webId, communityId],
    ),
    fetch,
  })

  const preferencesFiles = variables.hospexPreferencesFile

  const { results: permissions } = useReadAccesses(preferencesFiles ?? [])

  const results = zipWith(
    preferencesFiles ?? [],
    permissions,
    (url, permissionData) => ({
      url,
      permissions: permissionData,
    }),
  )

  return { results, isLoading }
}
