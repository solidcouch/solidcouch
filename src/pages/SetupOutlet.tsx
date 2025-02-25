import { IconLoading } from '@/components/IconLoading'
import { useConfig } from '@/config/hooks'
import {
  useCheckEmailNotifications,
  useCheckSetup,
  useCheckSimpleEmailNotifications,
} from '@/hooks/data/useCheckSetup'
import { selectAuth } from '@/redux/authSlice'
import { useAppSelector } from '@/redux/hooks'
import { Trans } from '@lingui/react/macro'
import omit from 'lodash/omit'
import { useState } from 'react'
import { FaCheck, FaClock, FaTimes } from 'react-icons/fa'
import { Outlet } from 'react-router-dom'
import { NonUndefined } from 'utility-types'
import { HospexSetup } from './HospexSetup'
import styles from './SetupOutlet.module.scss'

export const SetupOutlet = () => {
  const { communityId, emailNotificationsService, emailNotificationsType } =
    useConfig()
  const auth = useAppSelector(selectAuth)
  // const [notificationsInitialized, setNotificationsInitialized] =
  // useState(false)

  const [step, setStep] = useState(0)

  const setupCheck = useCheckSetup(auth.webId ?? '', communityId ?? '')
  const tasks = omit(setupCheck, [
    'publicTypeIndexes',
    'privateTypeIndexes',
    'personalHospexDocuments',
    'allHospexDocuments',
    'inboxes',
    'allHospex',
  ])

  // set up email
  const isSimpleEmailNotifications = useCheckSimpleEmailNotifications(
    auth.webId as string,
    emailNotificationsType === 'simple' ? emailNotificationsService : '',
  )
  const isEmailNotifications = useCheckEmailNotifications(
    setupCheck.inboxes[0] ?? '',
    emailNotificationsType === 'solid' ? emailNotificationsService : '',
  )

  const isEverythingSetUp =
    Object.values(setupCheck).every(v => v) &&
    (isEmailNotifications === true || isEmailNotifications === 'unset') &&
    (isSimpleEmailNotifications === true ||
      isSimpleEmailNotifications === 'unset')

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
    return (
      <Checking
        {...tasks}
        isEmailNotifications={isEmailNotifications}
        isSimpleEmailNotifications={isSimpleEmailNotifications}
      />
    )

  return (
    <HospexSetup
      {...(setupCheck as DefinedProps<typeof setupCheck>)}
      isSimpleEmailNotifications={isSimpleEmailNotifications}
      isEmailNotifications={isEmailNotifications}
      step={step}
      onStepChange={setStep}

      // onNotificationsInitialized={() => setNotificationsInitialized(true)}
      // onNotificationsInitializedTryAgain={() =>
      // setNotificationsInitialized(false)
      // }
      // isNotificationsInitialized={notificationsInitialized}
    />
  )
}

const Checking = (
  props: Record<`is${string}`, boolean | undefined | 'unverified' | 'unset'>,
) => {
  const items = Object.entries(props)
    .filter(([name, value]) => value !== 'unset' && name.startsWith('is'))
    .map(([name, value]) => ({
      key: name,
      label: formatLabel(name),
      value,
    }))

  return (
    <div className={styles.checkingContainer}>
      <h2>
        <Trans>Checking your setup...</Trans>
      </h2>
      <p>
        <Trans>We're verifying that everything is configured correctly.</Trans>
      </p>
      <ul className={styles.checklist}>
        {items.map(item => (
          <li key={item.key}>
            {item.value === true ? (
              <FaCheck />
            ) : item.value === false ? (
              <FaTimes />
            ) : item.value === 'unverified' ? (
              <FaClock />
            ) : (
              <IconLoading />
            )}{' '}
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

const formatLabel = (key: string): string => {
  return key
    .replace(/^is/, '') // Remove the "is" prefix
    .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
    .replace(/^./, str => str.toUpperCase())
}

type DefinedProps<T extends { [key: string]: unknown }> = {
  [Key in keyof T]: NonUndefined<T[Key]>
}
