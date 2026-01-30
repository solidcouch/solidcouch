import { Onboarding } from '@/components/Onboarding/Onboarding'
import { useConfig } from '@/config/hooks'
import {
  useCheckEmailNotifications,
  useCheckSetup,
  useCheckSimpleEmailNotifications,
  useInbox,
  usePrivateTypeIndex,
  usePublicTypeIndex,
} from '@/hooks/data/useCheckSetup'
import { selectAuth } from '@/redux/authSlice'
import { useAppSelector } from '@/redux/hooks'
import { Outlet } from 'react-router'
import { HospexSetup } from './HospexSetup'

export const SetupOutlet = () => {
  const { communityId, emailNotificationsService, emailNotificationsType } =
    useConfig()
  const auth = useAppSelector(selectAuth)

  const setupCheck = useCheckSetup(auth.webId!, communityId)

  // TODO use results
  usePublicTypeIndex(auth.webId!)
  usePrivateTypeIndex(auth.webId!)
  useInbox(auth.webId!)

  // set up email
  const isSimpleEmailNotifications = useCheckSimpleEmailNotifications(
    auth.webId!,
    emailNotificationsType === 'simple' ? emailNotificationsService : '',
  )

  const isEmailNotifications = useCheckEmailNotifications(
    setupCheck.inboxes.values().next().value?.value ?? '',
    emailNotificationsType === 'solid' ? emailNotificationsService : '',
  )

  const isEverythingSetUp =
    Object.values(setupCheck).every(v => v) &&
    (isEmailNotifications === true || isEmailNotifications === 'unset') &&
    (isSimpleEmailNotifications === true ||
      isSimpleEmailNotifications === 'unset')

  const isError = [
    ...Object.values(setupCheck),
    isSimpleEmailNotifications,
    isEmailNotifications,
  ].includes(false)

  return (
    <>
      {!isEverythingSetUp && (
        <HospexSetup
          {...setupCheck}
          isSimpleEmailNotifications={isSimpleEmailNotifications}
          isEmailNotifications={isEmailNotifications}
        />
      )}
      {!isError && <Outlet />}
      {isEverythingSetUp && <Onboarding />}
    </>
  )
}
