import { Loading } from '@/components'
import { useConfig } from '@/config/hooks'
import {
  useCheckEmailNotifications,
  useCheckSetup,
  useCheckSimpleEmailNotifications,
} from '@/hooks/data/useCheckSetup'
import { selectAuth } from '@/redux/authSlice'
import { useAppSelector } from '@/redux/hooks'
import omit from 'lodash/omit'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { NonUndefined } from 'utility-types'
import { HospexSetup } from './HospexSetup'

export const SetupOutlet = () => {
  const { communityId, emailNotificationsService, emailNotificationsType } =
    useConfig()
  const auth = useAppSelector(selectAuth)
  const [notificationsInitialized, setNotificationsInitialized] =
    useState(false)

  const setupCheck = useCheckSetup(auth.webId ?? '', communityId ?? '')
  const tasks = omit(setupCheck, [
    'publicTypeIndexes',
    'privateTypeIndexes',
    'personalHospexDocuments',
    'allHospexDocuments',
  ])

  // set up email
  const isSimpleEmailNotifications = useCheckSimpleEmailNotifications(
    auth.webId as string,
    emailNotificationsType === 'simple' ? emailNotificationsService : '',
  )
  const isEmailNotifications = useCheckEmailNotifications(
    setupCheck.inboxes[0],
    emailNotificationsType === 'solid' ? emailNotificationsService : '',
  )

  const isEverythingSetUp =
    Object.values(setupCheck).every(v => v) &&
    isSimpleEmailNotifications === true &&
    isEmailNotifications === true

  if (isEverythingSetUp) return <Outlet />

  const checks = Object.entries(tasks)
    .filter(([, value]) => value === undefined)
    .map(([key]) => key)
  if (isSimpleEmailNotifications === undefined) {
    checks.push('isSimpleEmailNotifications')
  }
  if (isEmailNotifications === undefined) {
    checks.push('isEmailNotifications')
  }
  if (
    Object.values(setupCheck).some(a => a === undefined) ||
    isSimpleEmailNotifications === undefined ||
    isEmailNotifications === undefined
  )
    return <Loading>Checking {checks.join(', ')}</Loading>

  return (
    <HospexSetup
      {...(setupCheck as DefinedProps<typeof setupCheck>)}
      isSimpleEmailNotifications={isSimpleEmailNotifications}
      isEmailNotifications={isEmailNotifications}
      onNotificationsInitialized={() => setNotificationsInitialized(true)}
      onNotificationsInitializedTryAgain={() =>
        setNotificationsInitialized(false)
      }
      isNotificationsInitialized={notificationsInitialized}
    />
  )
}

type DefinedProps<T extends { [key: string]: unknown }> = {
  [Key in keyof T]: NonUndefined<T[Key]>
}
