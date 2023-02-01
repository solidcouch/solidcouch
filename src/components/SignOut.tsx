import { logout } from '@inrupt/solid-client-authn-browser'
import { useAppDispatch } from 'app/hooks'
import * as authSlice from 'features/auth/authSlice'

export const SignOut = () => {
  const dispatch = useAppDispatch()
  const handleSignout = async () => {
    await logout()
    dispatch(authSlice.actions.signout())
  }

  return <button onClick={handleSignout}>sign out</button>
}
