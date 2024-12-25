import { Navigate } from 'react-router-dom'
import { Loading } from '../components/index.ts'
import { useAuth } from '../hooks/useAuth.ts'

export const ProfileRedirect = () => {
  const auth = useAuth()

  if (!auth.webId) return <Loading>authenticating</Loading>

  return <Navigate to={encodeURIComponent(auth.webId)} replace={true} />
}
