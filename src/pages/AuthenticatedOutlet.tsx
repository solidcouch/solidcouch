import { useAppSelector } from 'app/hooks'
import { Loading } from 'components/Loading/Loading'
import { selectAuth } from 'features/auth/authSlice'
import { SetupOutlet } from './SetupOutlet'
import { UnauthenticatedHome } from './UnauthenticatedHome'

export const AuthenticatedOutlet = () => {
  const auth = useAppSelector(selectAuth)

  if (auth.isLoggedIn === undefined) return <Loading>Authenticating...</Loading>

  if (auth.isLoggedIn === false) return <UnauthenticatedHome />

  return <SetupOutlet />
}
