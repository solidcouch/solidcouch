import { useAppSelector } from 'app/hooks'
import { selectAuth } from 'features/auth/authSlice'
import { Outlet } from 'react-router-dom'
import { UnauthenticatedHome } from './UnauthenticatedHome'

export const AuthenticatedOutlet = () => {
  const auth = useAppSelector(selectAuth)

  if (auth.isLoggedIn === undefined) return <>Loading...</>

  if (auth.isLoggedIn === false) return <UnauthenticatedHome />

  return <Outlet />
}
