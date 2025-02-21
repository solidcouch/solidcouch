import { Loading } from '@/components/Loading/Loading.tsx'
import { usePreviousUriAfterLogin } from '@/hooks/usePreviousUriAfterLogin'
import { selectAuth } from '@/redux/authSlice.ts'
import { useAppSelector } from '@/redux/hooks.ts'
import { Trans } from '@lingui/react/macro'
import { SetupOutlet } from './SetupOutlet.tsx'
import { UnauthenticatedHome } from './UnauthenticatedHome.tsx'

export const AuthenticatedOutlet = () => {
  usePreviousUriAfterLogin()

  const auth = useAppSelector(selectAuth)

  if (auth.isLoggedIn === undefined)
    return (
      <Loading>
        <Trans>Authenticating...</Trans>
      </Loading>
    )

  if (auth.isLoggedIn === false) return <UnauthenticatedHome />

  return <SetupOutlet />
}
