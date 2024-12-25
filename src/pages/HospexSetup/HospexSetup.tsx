import { Button } from '@/components/index.ts'
import { Loading } from '@/components/Loading/Loading.tsx'
import { useConfig } from '@/config/hooks.ts'
import { useReadCommunity } from '@/hooks/data/useCommunity.ts'
import { useJoinGroup } from '@/hooks/data/useJoinGroup.ts'
import {
  SetupSettings,
  SetupTask,
  useSetupHospex,
} from '@/hooks/data/useSetupHospex.ts'
import { useStorage } from '@/hooks/data/useStorage.ts'
import { useAuth } from '@/hooks/useAuth.ts'
import { URI } from '@/types/index.ts'
import { getContainer } from '@/utils/helpers.ts'
import { FormEventHandler, useState } from 'react'
import styles from './HospexSetup.module.scss'

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
  allHospex,
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
  allHospex: {
    hospexDocument: URI
    storage: URI
    communities: { uri: string; name: string }[]
  }[]
  isNotificationsInitialized: boolean
  onNotificationsInitialized: () => void
  onNotificationsInitializedTryAgain: () => void
}) => {
  const { communityContainer, communityId } = useConfig()
  const auth = useAuth()
  const setupHospex = useSetupHospex()
  const storage = useStorage(auth.webId ?? '')
  const community = useReadCommunity(communityId)
  const joinGroup = useJoinGroup()
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
      <header>Welcome to {community.name || 'SolidCouch'}!</header>
      <div>We would like to set up your Pod:</div>
      <form onSubmit={handleClickSetup}>
        <ul className={styles.taskList}>
          {!isMember && <li>Join community {community.name || communityId}</li>}
          {!isPublicTypeIndex && (
            <li>
              Create public type index{' '}
              {storage + 'settings/publicTypeIndex.ttl'}
            </li>
          )}
          {!isPrivateTypeIndex && (
            <li>
              Create private type index{' '}
              {storage + 'settings/privateTypeIndex.ttl'}
            </li>
          )}
          {!isInbox && <li>Create inbox {storage + 'inbox/'}</li>}
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
