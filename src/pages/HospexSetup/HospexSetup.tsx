import { IconLoading } from '@/components/IconLoading'
import { useConfig } from '@/config/hooks'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch } from '@/redux/hooks'
import * as uiSlice from '@/redux/uiSlice'
import { Trans } from '@lingui/react/macro'
import clsx from 'clsx'
import pick from 'lodash/pick'
import { Term } from 'n3'
import { Tabs } from 'radix-ui'
import { useCallback, useState } from 'react'
import { FaCheck } from 'react-icons/fa'
import { CommunitySetup } from './CommunitySetup'
import styles from './HospexSetup.module.scss'
import { NotificationsSetup } from './NotificationsSetup'
import { WebidProfileSetup } from './WebidProfileSetup'

interface SetupStatus {
  isMember: boolean | undefined
  isHospexProfile: boolean | undefined
  isPublicTypeIndex: boolean | undefined
  isPrivateTypeIndex: boolean | undefined
  isPreferencesFile: boolean | undefined
  isInbox: boolean | undefined
  isSimpleEmailNotifications: boolean | 'unset' | undefined
  isEmailNotifications: boolean | 'unverified' | 'unset' | undefined
}

interface SetupConfig {
  personalHospexDocuments: Set<Term>
  publicTypeIndexes: Set<Term>
  privateTypeIndexes: Set<Term>
  preferencesFiles: Set<Term>
  inboxes: Set<Term>
  allHospex: {
    hospexDocument: string
    communities: { uri: string; name: string }[]
  }[]
}

const stepStatusKeys: (keyof SetupStatus)[][] = [
  // eslint-disable-next-line lingui/no-unlocalized-strings
  ['isPublicTypeIndex', 'isPrivateTypeIndex', 'isInbox'],
  // eslint-disable-next-line lingui/no-unlocalized-strings
  ['isMember', 'isHospexProfile'],
  // eslint-disable-next-line lingui/no-unlocalized-strings
  ['isEmailNotifications', 'isSimpleEmailNotifications'],
]

export const HospexSetup = ({ ...props }: SetupStatus & SetupConfig) => {
  const stepStatus = stepStatusKeys
    .map(stepKeys => pick(props, stepKeys))
    .map(stepSetupValues => {
      const values = Object.values(stepSetupValues)
      if (values.includes(undefined)) return undefined
      if (values.includes(false)) return false
      return true
    })

  const dispatch = useAppDispatch()
  const [step, setStep] = useState(0)

  const handleStepSuccess = useCallback(
    (step: number) => {
      // turn on onboarding
      dispatch(uiSlice.actions.setOnboarding(0))
      setStep(step + 1)
    },
    [dispatch],
  )

  const auth = useAuth()
  const config = useConfig()

  const {
    isPublicTypeIndex,
    isPrivateTypeIndex,
    isPreferencesFile,
    isInbox,
    isMember,
    isHospexProfile,
    isEmailNotifications,
    isSimpleEmailNotifications,
  } = props

  const isWebidProfileSetupLoading =
    isPublicTypeIndex === undefined ||
    isPrivateTypeIndex === undefined ||
    isPreferencesFile === undefined ||
    isInbox === undefined
  const isCommunitySetupLoading =
    isHospexProfile === undefined || isMember === undefined
  const isNotificationsSetupLoading =
    isEmailNotifications === undefined ||
    isSimpleEmailNotifications === undefined

  const isSetupLoading =
    isWebidProfileSetupLoading ||
    isCommunitySetupLoading ||
    isNotificationsSetupLoading

  return (
    <div className={styles.container}>
      <Tabs.Root value={String(step)} onValueChange={value => setStep(+value)}>
        <Tabs.List className={styles.list} loop={false}>
          {[0, 1, 2].map((_, i) => {
            return (
              <Tabs.Trigger
                key={i} // not recommended, but likely safe with the unchanging array
                value={String(i)}
                disabled={!stepStatus.slice(0, i).every(a => !!a)}
                className={clsx(
                  styles.trigger,
                  stepStatus[i] && styles.success,
                  i < 2 && styles.connect,
                )}
              >
                {stepStatus[i] ? (
                  <FaCheck />
                ) : stepStatus[i] === undefined ? (
                  <IconLoading />
                ) : (
                  i + 1
                )}
              </Tabs.Trigger>
            )
          })}
        </Tabs.List>
        {!isSetupLoading && (
          <>
            <Tabs.Content value="0" className={styles.content}>
              <h2>
                <Trans>Prepare Pod</Trans>
              </h2>
              <WebidProfileSetup
                onSuccess={() => handleStepSuccess(0)}
                isPublicTypeIndex={isPublicTypeIndex}
                isPrivateTypeIndex={isPrivateTypeIndex}
                isPreferencesFile={isPreferencesFile}
                isInbox={isInbox}
                webId={auth.webId!}
                preferencesFile={
                  props.preferencesFiles.values().next().value?.value
                }
                publicTypeIndex={
                  props.publicTypeIndexes.values().next().value?.value
                }
                privateTypeIndex={
                  props.privateTypeIndexes.values().next().value?.value
                }
              />
            </Tabs.Content>
            <Tabs.Content value="1" className={styles.content}>
              <h2>
                <Trans>Join Community</Trans>
              </h2>
              <CommunitySetup
                onSuccess={() => handleStepSuccess(1)}
                isMember={isMember}
                isHospexProfile={isHospexProfile}
                allHospex={props.allHospex}
                publicTypeIndex={
                  props.publicTypeIndexes.values().next().value?.value
                }
              />
            </Tabs.Content>
            <Tabs.Content value="2" className={styles.content}>
              <h2>
                <Trans>Set Up Notifications</Trans>
              </h2>
              <NotificationsSetup
                isEmailNotifications={isEmailNotifications}
                isSimpleEmailNotifications={isSimpleEmailNotifications}
                hospexDocument={
                  props.allHospex.find(ah =>
                    ah.communities.some(ahc => ahc.uri === config.communityId),
                  )?.hospexDocument
                }
                inbox={props.inboxes.values().next().value?.value}
                onSuccess={() => handleStepSuccess(2)}
              />
            </Tabs.Content>
          </>
        )}
      </Tabs.Root>
    </div>
  )
}

export interface StepProps {
  onSuccess: () => void
}
