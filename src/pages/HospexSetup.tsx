import { Button } from 'components'
import { Loading } from 'components/Loading/Loading'
import { communityContainer, communityId } from 'config'
import { useReadCommunity } from 'hooks/data/useCommunity'
import { useJoinGroup } from 'hooks/data/useJoinGroup'
import {
  SetupSettings,
  SetupTask,
  useSetupHospex,
} from 'hooks/data/useSetupHospex'
import { useStorage } from 'hooks/data/useStorage'
import { useAuth } from 'hooks/useAuth'
import { useState } from 'react'
import { URI } from 'types'

export const HospexSetup = ({
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
}: {
  isMember: boolean
  isHospexProfile: boolean
  isPublicTypeIndex: boolean
  isPrivateTypeIndex: boolean
  isInbox: boolean
  isEmailNotifications: boolean | 'unverified'
  isSimpleEmailNotifications: boolean | 'unverified'
  personalHospexDocuments: URI[]
  publicTypeIndexes: URI[]
  privateTypeIndexes: URI[]
  inboxes: URI[]
  isNotificationsInitialized: boolean
  onNotificationsInitialized: () => void
  onNotificationsInitializedTryAgain: () => void
}) => {
  const auth = useAuth()
  const setupHospex = useSetupHospex()
  const storage = useStorage(auth.webId ?? '')
  const community = useReadCommunity(communityId)
  const joinGroup = useJoinGroup()
  const [isSaving, setIsSaving] = useState(false)
  const [email, setEmail] = useState('')
  const handleClickSetup = async () => {
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
      if (!isHospexProfile) tasks.push('createHospexProfile')
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
          : `${storage}hospex/${communityContainer}/card`,
        email,
      }
      await setupHospex(tasks, settings)
      onNotificationsInitialized()
    }
    if (!isMember)
      await joinGroup({
        person: auth.webId as URI,
        group: community.groups[0],
      })
    setIsSaving(false)
  }

  if (isSaving) return <Loading>Preparing your Pod...</Loading>

  if (!storage) return <Loading>Searching your storage...</Loading>

  return (
    <div>
      <header>Welcome to sleepy.bike!</header>
      <div>We would like to set up your Pod:</div>
      <ul>
        <li>{!isMember && `join community ${communityId}`}</li>
        <li>
          {!isPublicTypeIndex &&
            `create public type index ${
              storage + 'settings/publicTypeIndex.ttl'
            }`}
        </li>
        <li>
          {!isPrivateTypeIndex &&
            `create private type index ${
              storage + 'settings/privateTypeIndex.ttl'
            }`}
        </li>
        <li>{!isInbox && `create inbox ${storage + 'inbox/'}`}</li>
        <li>
          {!isHospexProfile &&
            'setup hospex document and storage ' +
              `${storage}hospex/${communityContainer}/card`}
        </li>
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
        <li>
          {!isSimpleEmailNotifications &&
            (!isNotificationsInitialized ? (
              <div>
                Setup simple email notifications{' '}
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            ) : (
              <div>
                Please verify your email. Email didn't arrive?{' '}
                <Button secondary onClick={onNotificationsInitializedTryAgain}>
                  Try again
                </Button>
              </div>
            ))}
        </li>
      </ul>
      <Button primary onClick={() => handleClickSetup()}>
        Continue!
      </Button>
    </div>
  )
}
