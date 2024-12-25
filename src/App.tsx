import { handleIncomingRedirect } from '@inrupt/solid-client-authn-browser'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Slide, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAppDispatch } from './app/hooks.ts'
import { Head } from './components/Head.tsx'
import { Header as PageHeader } from './components/index.ts'
import { useSetEditableConfig } from './config/hooks.ts'
import { actions } from './features/auth/authSlice.ts'
import { useAuth } from './hooks/useAuth.ts'
import { usePreviousUriAfterSolidRedirect } from './hooks/usePreviousUriAfterSolidRedirect.ts'
import { Content, Header, Layout } from './layouts/Layout.tsx'

export const App = () => {
  // initialize the app, provide layout

  useSetEditableConfig()

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
      <Head />
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
