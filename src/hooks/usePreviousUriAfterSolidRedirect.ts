import { EVENTS, getDefaultSession } from '@inrupt/solid-client-authn-browser'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

// https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/restore-session-browser-refresh/#use-session-restore-event-handler

export const usePreviousUriAfterSolidRedirect = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const session = getDefaultSession()
    session.events.on(EVENTS.SESSION_RESTORED, url => {
      navigate(new URL(url).pathname, { replace: true })
    })
    // we want to run this only once, but navigate makes this run multiple times, so we don't mention it in hook dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
