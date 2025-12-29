import { useConfig } from '@/config/hooks'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLdhopQuery } from '@ldhop/react'
import zipWith from 'lodash/zipWith'
import { useMemo } from 'react'
import { useAuth } from '../useAuth'
import { useReadAccesses } from './access'
import { emailVerificationQuery } from './queries/hospex'

export const useReadEmailVerificationSetup = () => {
  const auth = useAuth()
  const { communityId } = useConfig()
  const { variables, isLoading } = useLdhopQuery({
    query: emailVerificationQuery,
    variables: useMemo(
      () => ({
        person: auth.webId ? new Set([auth.webId]) : undefined,
        community: new Set([communityId]),
      }),
      [auth.webId, communityId],
    ),
    fetch,
  })

  const preferencesFiles = Array.from(variables.hospexPreferencesFile)
    .filter(pft => pft.termType === 'NamedNode')
    .map(pft => pft.value)

  const { results: permissions } = useReadAccesses(preferencesFiles)

  const results = zipWith(
    preferencesFiles,
    permissions,
    (url, permissionData) => ({ url, permissions: permissionData }),
  )

  return { results, isLoading }
}
