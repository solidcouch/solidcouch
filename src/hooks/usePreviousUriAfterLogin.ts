import { useAppSelector } from '@/app/hooks'
import { selectAuth } from '@/features/auth/authSlice'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const usePreviousUriAfterLogin = () => {
  const auth = useAppSelector(selectAuth)
  const navigate = useNavigate()

  // navigate to previous URI after login
  useEffect(() => {
    // save url to get back to it after login
    if (auth.isLoggedIn === false) {
      const currentUrl = globalThis.location.href
      globalThis.localStorage.setItem('previousUrl', currentUrl)
    }

    // redirect to previous url
    if (auth.isLoggedIn === true) {
      const previousUrl = globalThis.localStorage.getItem('previousUrl')
      if (previousUrl) {
        const url = new URL(previousUrl)
        // make sure domain matches, then navigate to previous url
        if (url.hostname === new URL(globalThis.location.href).hostname)
          navigate(url.pathname + url.search + url.hash, { replace: true })
      }
      globalThis.localStorage.removeItem('previousUrl')
    }
  }, [auth.isLoggedIn, navigate])
}
