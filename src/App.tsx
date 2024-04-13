import { handleIncomingRedirect } from '@inrupt/solid-client-authn-browser'
import { useAppDispatch } from 'app/hooks'
import { Header as PageHeader } from 'components'
import { actions } from 'features/auth/authSlice'
import { useAuth } from 'hooks/useAuth'
import { usePreviousUriAfterSolidRedirect } from 'hooks/usePreviousUriAfterSolidRedirect'
import { Content, Header, Layout } from 'layouts/Layout'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Slide, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export const App = () => {
  // initialize the app, provide layout

  usePreviousUriAfterSolidRedirect()

  const dispatch = useAppDispatch()
  const auth = useAuth()

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
      <ToastContainer transition={Slide} />
      <Header>
        <PageHeader />
      </Header>
      <Content>
        {auth.isLoggedIn === undefined ? <>Loading...</> : <Outlet />}
      </Content>
    </Layout>
  )
}
