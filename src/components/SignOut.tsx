import { useAppDispatch } from '@/app/hooks'
import * as authSlice from '@/features/auth/authSlice'
import { logout } from '@inrupt/solid-client-authn-browser'

export const SignOut = () => {
  const dispatch = useAppDispatch()
  const handleSignout = async () => {
    await logout()
    dispatch(authSlice.actions.signout())
  }

  return <button onClick={handleSignout}>sign out</button>
}
