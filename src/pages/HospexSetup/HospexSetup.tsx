import { useConfig } from '@/config/hooks'
import { useStorage } from '@/hooks/data/useStorage'
import { useAuth } from '@/hooks/useAuth'
import { Trans } from '@lingui/react/macro'
import clsx from 'clsx'
import pick from 'lodash/pick'
import { Tabs } from 'radix-ui'
import { useMemo } from 'react'
import styles from './HospexSetup.module.scss'
import { Step0 } from './Step0'
import { Step1 } from './Step1'
import { Step2 } from './Step2'
import { SetupStatusKey } from './types'

interface SetupStatus {
  [SetupStatusKey.isMember]: boolean
  [SetupStatusKey.isHospexProfile]: boolean
  [SetupStatusKey.isPublicTypeIndex]: boolean
  [SetupStatusKey.isPrivateTypeIndex]: boolean
  [SetupStatusKey.isInbox]: boolean
  [SetupStatusKey.isSimpleEmailNotifications]: boolean | 'unset'
  [SetupStatusKey.isEmailNotifications]: boolean | 'unverified' | 'unset'
}

interface SetupConfig {
  personalHospexDocuments: string[]
  publicTypeIndexes: string[]
  privateTypeIndexes: string[]
  inboxes: string[]
  allHospex: {
    hospexDocument: string
    communities: { uri: string; name: string }[]
  }[]
}

const stepStatusKeys: (keyof SetupStatus)[][] = [
  [
    SetupStatusKey.isPublicTypeIndex,
    SetupStatusKey.isPrivateTypeIndex,
    SetupStatusKey.isInbox,
  ],
  [SetupStatusKey.isMember, SetupStatusKey.isHospexProfile],
  [
    SetupStatusKey.isEmailNotifications,
    SetupStatusKey.isSimpleEmailNotifications,
  ],
]

export const HospexSetup = (
  props: SetupStatus &
    SetupConfig & { step: number; onStepChange: (step: number) => void },
) => {
  const stepStatus: boolean[] = stepStatusKeys
    .map(stepKeys => pick(props, stepKeys))
    .map(stepSetupValues => Object.values(stepSetupValues).every(a => a))

  const auth = useAuth()
  const storage = useStorage(auth.webId!)
  const config = useConfig()

  const steps = useMemo(
    () => [
      {
        title: <Trans>Prepare Pod</Trans>,
        content:
          storage && auth.webId ? (
            <Step0
              onSuccess={() => props.onStepChange(1)}
              isPublicTypeIndex={props.isPublicTypeIndex}
              isPrivateTypeIndex={props.isPrivateTypeIndex}
              isInbox={props.isInbox}
              storage={storage}
              webId={auth.webId}
            />
          ) : null,
      },
      {
        title: <Trans>Join Community</Trans>,
        content: (
          <Step1
            onSuccess={() => props.onStepChange(2)}
            isMember={props.isMember}
            isHospexProfile={props.isHospexProfile}
            allHospex={props.allHospex}
            publicTypeIndex={props.publicTypeIndexes[0]}
          />
        ),
      },
      {
        title: <Trans>Set Up Notifications</Trans>,
        content: (
          <Step2
            isEmailNotifications={props.isEmailNotifications}
            isSimpleEmailNotifications={props.isSimpleEmailNotifications}
            hospexDocument={
              props.allHospex.find(ah =>
                ah.communities.some(ahc => ahc.uri === config.communityId),
              )?.hospexDocument
            }
            inbox={props.inboxes[0]}
            onSuccess={() => {}}
          />
        ),
      },
    ],
    [auth.webId, config.communityId, props, storage],
  )

  if (!storage) return <>...</>

  return (
    <div className={styles.container}>
      <h1>
        <Trans>Setup</Trans>
      </h1>
      <Tabs.Root
        value={String(props.step)}
        onValueChange={value => props.onStepChange(+value)}
      >
        <Tabs.List className={styles.list} loop={false}>
          {steps.map((_, i) => {
            return (
              <Tabs.Trigger
                className={clsx(
                  styles.trigger,
                  i < steps.length - 1 && styles.connect,
                )}
                key={i} // not recommended, but likely safe with the unchanging array
                value={String(i)}
                disabled={!stepStatus.slice(0, i).every(a => !!a)}
              >
                {i + 1}
              </Tabs.Trigger>
            )
          })}
        </Tabs.List>
        {steps.map((step, i) => (
          <Tabs.Content value={String(i)} className={styles.content} key={i}>
            <h2>{step.title}</h2>
            {step.content}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  )
}

export interface StepProps {
  onSuccess: () => void
}
