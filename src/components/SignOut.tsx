import { logout } from '@inrupt/solid-client-authn-browser'
import { useAppDispatch } from '../app/hooks.ts'
import * as authSlice from '../features/auth/authSlice.ts'

export const SignOut = () => {
  const dispatch = useAppDispatch()
  const handleSignout = async () => {
    await logout()
    dispatch(authSlice.actions.signout())
  }

  return <button onClick={handleSignout}>sign out</button>
}
