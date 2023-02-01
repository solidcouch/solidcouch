import { handleIncomingRedirect } from '@inrupt/solid-client-authn-browser'
import { useAppDispatch, useAppSelector } from 'app/hooks'
import { SignIn } from 'components/SignIn'
import { actions, selectAuth } from 'features/auth/authSlice'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from './Layout'

export const AuthenticatedOutlet = () => {
  const dispatch = useAppDispatch()
  const auth = useAppSelector(selectAuth)

  useEffect(() => {
    ;(async () => {
      const session = await handleIncomingRedirect({
        restorePreviousSession: true,
      })

      if (session) dispatch(actions.signin(session))
    })()
  }, [dispatch])

  if (auth.isLoggedIn === undefined) return <>Loading...</>

  if (auth.isLoggedIn === false)
    return (
      <Layout>
        <SignIn />
      </Layout>
    )

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
