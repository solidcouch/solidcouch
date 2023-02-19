import { useAppSelector } from 'app/hooks'
import { Loading } from 'components/Loading/Loading'
import { selectAuth } from 'features/auth/authSlice'
import { usePersonalHospexDocuments } from 'hooks/usePersonalHospexDocuments'
import { Outlet } from 'react-router-dom'
import { HospexSetup } from './HospexSetup'
import { UnauthenticatedHome } from './UnauthenticatedHome'

export const AuthenticatedOutlet = () => {
  const auth = useAppSelector(selectAuth)

  // is hospex set up?
  const setup = usePersonalHospexDocuments(auth.webId)

  if (auth.isLoggedIn === undefined) return <Loading>Authenticating...</Loading>

  if (auth.isLoggedIn === false) return <UnauthenticatedHome />

  if (setup.isLoading) return <Loading>Checking...</Loading>
  if (
    setup.error === 'TYPE_INDEX_MISSING' ||
    setup.error === 'HOSPEX_NOT_SET_UP'
  )
    return <HospexSetup />

  return <Outlet />
}
