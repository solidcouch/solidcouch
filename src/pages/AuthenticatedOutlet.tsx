import {
  fetch,
  handleIncomingRedirect,
} from '@inrupt/solid-client-authn-browser'
import { useAppDispatch, useAppSelector } from 'app/hooks'
import { SignIn } from 'components/SignIn'
import { actions, selectAuth } from 'features/auth/authSlice'
import { FoafProfileFactory } from 'ldo/foafProfile.ldoFactory'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { ldo2json } from 'utils/ldo'
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

      if (session?.isLoggedIn && session.webId) {
        const rawProfile = await (await fetch(session.webId)).text()
        const profile = await FoafProfileFactory.parse(
          session.webId,
          rawProfile,
          { baseIRI: session.webId },
        )

        dispatch(actions.setUser(ldo2json(profile)))
      }
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
