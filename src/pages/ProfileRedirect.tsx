import { Loading } from '@/components'
import { useAuth } from '@/hooks/useAuth'
import { Trans } from '@lingui/react/macro'
import { Navigate } from 'react-router-dom'

export const ProfileRedirect = () => {
  const auth = useAuth()

  if (!auth.webId)
    return (
      <Loading>
        <Trans>authenticating</Trans>
      </Loading>
    )

  return <Navigate to={encodeURIComponent(auth.webId)} replace={true} />
}
