import { handleIncomingRedirect } from '@inrupt/solid-client-authn-browser'
import { useAppDispatch, useAppSelector } from 'app/hooks'
import { Header as PageHeader } from 'components'
import { actions, selectAuth } from 'features/auth/authSlice'
import { usePreviousUriAfterSolidRedirect } from 'hooks/usePreviousUriAfterSolidRedirect'
import { Content, Header, Layout } from 'layouts/Layout'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

export const App = () => {
  // initialize the app, provide layout

  usePreviousUriAfterSolidRedirect()

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

  return (
    <Layout>
      <Header>
        <PageHeader />
      </Header>
      <Content>
        {auth.isLoggedIn === undefined ? <>Loading...</> : <Outlet />}
      </Content>
    </Layout>
  )
}
