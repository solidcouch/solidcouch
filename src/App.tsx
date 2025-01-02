import { handleIncomingRedirect } from '@inrupt/solid-client-authn-browser'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Slide, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Header as PageHeader } from './components'
import { Head } from './components/Head.tsx'
import { useSetEditableConfig } from './config/hooks'
import { useAuth } from './hooks/useAuth'
import { usePreviousUriAfterSolidRedirect } from './hooks/usePreviousUriAfterSolidRedirect'
import { Content, Header, Layout } from './layouts/Layout.tsx'
import { actions } from './redux/authSlice.ts'
import { useAppDispatch, useAppSelector } from './redux/hooks.ts'
import { selectTheme } from './redux/uiSlice.ts'

export const App = () => {
  // initialize the app, provide layout

  useSetEditableConfig()

  usePreviousUriAfterSolidRedirect()

  const dispatch = useAppDispatch()
  const auth = useAuth()

  const theme = useAppSelector(selectTheme)

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

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
