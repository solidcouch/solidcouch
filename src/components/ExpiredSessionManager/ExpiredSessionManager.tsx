import { EVENTS, getDefaultSession } from '@inrupt/solid-client-authn-browser'
import { Trans } from '@lingui/react/macro'
import clsx from 'clsx'
import { AlertDialog } from 'radix-ui'
import { useEffect, useState } from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'
import 'react-toastify/dist/ReactToastify.css'
import { Button } from '../Button/Button'
import { SignInForm } from '../SignIn/SignIn'
import styles from './ExpiredSessionManager.module.scss'

export const ExpiredSessionManager = () => {
  // initialize the app, provide layout

  const [expired, setExpired] = useState(false)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const session = getDefaultSession()

    const promptSignin = () => {
      setExpired(true)
    }

    // if current date goes over expiration date, we prompt signin
    // This is a partial mitigation of https://github.com/inrupt/solid-client-authn-js/issues/4164
    // TODO it may be removed if the issue gets addressed
    const intervalId = window.setInterval(() => {
      if (
        session.info.expirationDate &&
        session.info.expirationDate < Date.now()
      )
        promptSignin()
    }, 30000)

    session.events.on(EVENTS.SESSION_EXPIRED, promptSignin)

    return () => {
      window.clearInterval(intervalId)
      session.events.off(EVENTS.SESSION_EXPIRED, promptSignin)
    }
  }, [])

  return (
    <AlertDialog.Root open={expired && open} onOpenChange={setOpen}>
      {expired && (
        <AlertDialog.Trigger
          className={clsx(styles.trigger, open && styles.active)}
        >
          <FaExclamationTriangle />
          <Trans>Session Expired!</Trans>
        </AlertDialog.Trigger>
      )}
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content className={styles.content}>
          <AlertDialog.Title asChild>
            <h2>
              <Trans>Your session has expired. Please sign in again.</Trans>
            </h2>
          </AlertDialog.Title>
          <AlertDialog.Description
            className={styles.description}
          ></AlertDialog.Description>
          <SignInForm short />
          <AlertDialog.Action asChild>
            <Button secondary className={styles.later}>
              <Trans>Later</Trans>
            </Button>
          </AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
