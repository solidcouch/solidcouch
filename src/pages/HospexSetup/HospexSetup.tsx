import { Button } from '@/components'
import { Loading } from '@/components/Loading/Loading.tsx'
import { useConfig } from '@/config/hooks'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { useJoinCommunity, useJoinGroupLegacy } from '@/hooks/data/useJoinGroup'
import {
  SetupSettings,
  SetupTask,
  useSetupHospex,
} from '@/hooks/data/useSetupHospex'
import { useStorage } from '@/hooks/data/useStorage'
import { useAuth } from '@/hooks/useAuth'
import { URI } from '@/types'
import { getContainer } from '@/utils/helpers'
import * as Tabs from '@radix-ui/react-tabs'
import clsx from 'clsx'
import pick from 'lodash/pick'
import { FormEventHandler, useMemo, useState } from 'react'
import styles from './HospexSetup.module.scss'
import { Step0 } from './Step0'
import { Step1 } from './Step1'
import { Step2 } from './Step2'

interface SetupStatus {
  isMember: boolean
  isHospexProfile: boolean
  isPublicTypeIndex: boolean
  isPrivateTypeIndex: boolean
  isInbox: boolean
  isSimpleEmailNotifications: boolean | 'unset'
  isEmailNotifications: boolean | 'unverified' | 'unset'
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
  ['isPublicTypeIndex', 'isPrivateTypeIndex', 'isInbox'],
  ['isMember', 'isHospexProfile'],
  ['isEmailNotifications', 'isSimpleEmailNotifications'],
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
        title: 'Prepare Pod',
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
        title: 'Join Community',
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
        title: 'Set Up Notifications',
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
      <h1>Setup</h1>
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

export const HospexSetupLegacy = ({
  isMember,
  isPublicTypeIndex,
  isPrivateTypeIndex,
  isHospexProfile,
  isInbox,
  isEmailNotifications,
  isSimpleEmailNotifications,
  personalHospexDocuments,
  publicTypeIndexes,
  privateTypeIndexes,
  inboxes,
  isNotificationsInitialized,
  onNotificationsInitialized,
  onNotificationsInitializedTryAgain,
  allHospex,
}: {
  isMember: boolean
  isHospexProfile: boolean
  isPublicTypeIndex: boolean
  isPrivateTypeIndex: boolean
  isInbox: boolean
  isEmailNotifications: boolean | 'unverified' | 'unset'
  isSimpleEmailNotifications: boolean | 'unverified' | 'unset'
  personalHospexDocuments: URI[]
  publicTypeIndexes: URI[]
  privateTypeIndexes: URI[]
  inboxes: URI[]
  allHospex: {
    hospexDocument: URI
    storage: URI
    communities: { uri: string; name: string }[]
  }[]
  isNotificationsInitialized: boolean
  onNotificationsInitialized: () => void
  onNotificationsInitializedTryAgain: () => void
}) => {
  isSimpleEmailNotifications =
    isSimpleEmailNotifications === 'unset' ? true : isSimpleEmailNotifications
  isEmailNotifications =
    isEmailNotifications === 'unset' ? true : isEmailNotifications

  const { communityContainer, communityId } = useConfig()
  const auth = useAuth()
  const setupHospex = useSetupHospex()
  const storage = useStorage(auth.webId ?? '')
  const community = useReadCommunity(communityId)
  const joinGroupLegacy = useJoinGroupLegacy()
  const joinCommunity = useJoinCommunity()
  const [isSaving, setIsSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [selectedHospexDocument, setSelectedHospexDocument] = useState('')
  const [addToExisting, setAddToExisting] = useState<boolean>()
  const newHospexDocument = `${storage}hospex/${communityContainer}/card`

  const handleClickSetup: FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()

    setIsSaving(true)
    if (
      !isPublicTypeIndex ||
      !isPrivateTypeIndex ||
      !isHospexProfile ||
      !isInbox ||
      !isEmailNotifications ||
      !isSimpleEmailNotifications
    ) {
      const tasks: SetupTask[] = []
      if (!isPublicTypeIndex) tasks.push('createPublicTypeIndex')
      if (!isPrivateTypeIndex) tasks.push('createPrivateTypeIndex')
      if (!isHospexProfile) {
        if (allHospex.length === 0) tasks.push('createHospexProfile')
        else if (typeof addToExisting === 'boolean') {
          if (addToExisting) {
            tasks.push('addToHospexProfile')
          } else tasks.push('createHospexProfile')
        }
      }
      if (!isInbox) tasks.push('createInbox')
      if (!isEmailNotifications) tasks.push('integrateEmailNotifications')
      if (!isSimpleEmailNotifications)
        tasks.push('integrateSimpleEmailNotifications')
      if (!auth.webId) throw new Error('not signed in')
      if (isPublicTypeIndex && !publicTypeIndexes[0])
        throw new Error('existing public type index not found')
      if (isPrivateTypeIndex && !privateTypeIndexes[0])
        throw new Error('existing private type index not found')
      const settings: SetupSettings = {
        person: auth.webId,
        publicTypeIndex: isPublicTypeIndex
          ? publicTypeIndexes[0]
          : `${storage}settings/publicTypeIndex.ttl`,
        privateTypeIndex: isPrivateTypeIndex
          ? privateTypeIndexes[0]
          : `${storage}settings/privateTypeIndex.ttl`,
        inbox: isInbox ? inboxes[0] : `${storage}inbox/`,
        hospexDocument: isHospexProfile
          ? personalHospexDocuments[0]
          : allHospex.length > 0
            ? selectedHospexDocument
            : newHospexDocument,
        email,
      }
      await setupHospex(tasks, settings)
      onNotificationsInitialized()
    }
    if (!isMember)
      if (community.inbox)
        await joinCommunity({
          actor: auth.webId!,
          object: community.community,
          type: 'Join',
          inbox: community.inbox,
        })
      else
        await joinGroupLegacy({
          person: auth.webId as URI,
          group: community.groups[0],
        })
    setIsSaving(false)
  }

  if (isSaving) return <Loading>Preparing your Pod...</Loading>

  if (!storage) return <Loading>Searching your storage...</Loading>

  return (
    <div>
      <header>Welcome to {community.name || 'SolidCouch'}!</header>
      <div>We would like to set up your Pod:</div>
      <form onSubmit={handleClickSetup}>
        <ul className={styles.taskList}>
          {!isMember && <li>Join community {community.name || communityId}</li>}
          {!isHospexProfile && allHospex.length === 0 && (
            <li>Setup hospex document and storage {newHospexDocument}</li>
          )}
          {!isHospexProfile && allHospex.length > 0 && (
            <li>
              <legend>Setup hospex document and storage</legend>
              <fieldset className={styles.storageOptions}>
                <legend>
                  You already seem to be a member of some hospitality exchange
                  (hospex) communities. Would you like to:
                </legend>
                <div className={styles.option}>
                  <input
                    required
                    type="radio"
                    id="new-hospex-document"
                    name="hospexDocument"
                    value={newHospexDocument}
                    checked={newHospexDocument === selectedHospexDocument}
                    onChange={e => {
                      setSelectedHospexDocument(e.target.value)
                      setAddToExisting(false)
                    }}
                  />{' '}
                  <label htmlFor="new-hospex-document">
                    Set up new data for this community (
                    {new URL(getContainer(newHospexDocument)).pathname})
                  </label>
                </div>
                <div>
                  <legend>
                    Or use data (profile, hosting offers, etc.) from one of your
                    existing communities?{' '}
                    <i>(Recommended for similar communities)</i>
                  </legend>
                  {allHospex.map(({ hospexDocument, communities }, i) => (
                    <div key={hospexDocument} className={styles.option}>
                      <input
                        required
                        type="radio"
                        id={`hospexDocument-${i}`}
                        name="hospexDocument"
                        value={hospexDocument}
                        checked={hospexDocument === selectedHospexDocument}
                        onChange={() => {
                          setSelectedHospexDocument(hospexDocument)
                          setAddToExisting(true)
                        }}
                      />{' '}
                      <label htmlFor={`hospexDocument-${i}`}>
                        {communities.map(c => c.name ?? c.uri).join(', ')} (
                        {new URL(getContainer(hospexDocument)).pathname})
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </li>
          )}
          {(!isEmailNotifications || isEmailNotifications === 'unverified') && (
            <li>
              {!isEmailNotifications && (
                <div>
                  Setup email notifications{' '}
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              )}
              {isEmailNotifications === 'unverified' && (
                <div>Please verify your email</div>
              )}
            </li>
          )}
          {!isSimpleEmailNotifications && (
            <li>
              {!isNotificationsInitialized ? (
                <div>
                  Setup simple email notifications{' '}
                  <input
                    required
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <div>
                    Please verify your email. It may take a few minutes &mdash;
                    check your inbox and Spam folder.
                  </div>
                  <div>
                    Email didn't arrive?{' '}
                    <Button
                      secondary
                      onClick={onNotificationsInitializedTryAgain}
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )}
        </ul>
        <Button primary type="submit">
          Continue!
        </Button>
      </form>
    </div>
  )
}
