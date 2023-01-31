import {
  handleIncomingRedirect,
  ISessionInfo,
} from '@inrupt/solid-client-authn-browser'
import { SignIn } from 'components/SignIn'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from './Layout'

export const AuthenticatedOutlet = () => {
  const [session, setSession] = useState<ISessionInfo>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const session = await handleIncomingRedirect({
        restorePreviousSession: true,
      })

      setSession(session)
      if (session) setLoading(false)
    })()
  }, [])

  if (loading) {
    return <>Loading...</>
  } else if (session?.isLoggedIn) {
    return (
      <Layout>
        <Outlet />
      </Layout>
    )
  } else
    return (
      <Layout>
        <SignIn />
      </Layout>
    )
}
