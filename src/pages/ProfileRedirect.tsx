import { Loading } from 'components'
import { useAuth } from 'hooks/useAuth'
import { Navigate } from 'react-router-dom'

export const ProfileRedirect = () => {
  const auth = useAuth()

  if (!auth.webId) return <Loading>authenticating</Loading>

  return <Navigate to={encodeURIComponent(auth.webId)} replace={true} />
}
