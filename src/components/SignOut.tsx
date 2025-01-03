import * as authSlice from '@/redux/authSlice'
import { useAppDispatch } from '@/redux/hooks'
import { logout } from '@inrupt/solid-client-authn-browser'

export const SignOut = () => {
  const dispatch = useAppDispatch()
  const handleSignout = async () => {
    await logout()
    dispatch(authSlice.actions.signout())
  }

  return <button onClick={handleSignout}>sign out</button>
}
