import { URI } from '@/types'
import { EVENTS, getDefaultSession } from '@inrupt/solid-client-authn-browser'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

// https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/restore-session-browser-refresh/#use-session-restore-event-handler

export const usePreviousUriAfterSolidRedirect = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const listener = (url: URI) => {
      const u = new URL(url)
      // prevent malicious origin to pass values
      // may not be necessary, but keep it anyways
      if (u.origin !== globalThis.location.origin) return
      navigate(
        { pathname: u.pathname, hash: u.hash, search: u.search },
        { replace: true },
      )
    }

    const session = getDefaultSession()
    session.events.on(EVENTS.SESSION_RESTORED, listener)

    return () => {
      session.events.off(EVENTS.SESSION_RESTORED, listener)
    }
  }, [navigate])
}
