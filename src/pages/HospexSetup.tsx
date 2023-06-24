import { Button } from 'components'
import { Loading } from 'components/Loading/Loading'
import { communityId } from 'config'
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
  personalHospexDocuments,
  publicTypeIndexes,
  privateTypeIndexes,
  inboxes,
}: {
  isMember: boolean
  isHospexProfile: boolean
  isPublicTypeIndex: boolean
  isPrivateTypeIndex: boolean
  isInbox: boolean
  personalHospexDocuments: URI[]
  publicTypeIndexes: URI[]
  privateTypeIndexes: URI[]
  inboxes: URI[]
}) => {
  const auth = useAuth()
  const setupHospex = useSetupHospex()
  const storage = useStorage(auth.webId ?? '')
  const community = useReadCommunity(communityId)
  const joinGroup = useJoinGroup()
  const [isSaving, setIsSaving] = useState(false)
  const handleClickSetup = async () => {
    setIsSaving(true)
    if (
      !isPublicTypeIndex ||
      !isPrivateTypeIndex ||
      !isHospexProfile ||
      !isInbox
    ) {
      const tasks: SetupTask[] = []
      if (!isPublicTypeIndex) tasks.push('createPublicTypeIndex')
      if (!isPrivateTypeIndex) tasks.push('createPrivateTypeIndex')
      if (!isHospexProfile) tasks.push('createHospexProfile')
      if (!isInbox) tasks.push('createInbox')

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
          : `${storage}hospex/sleepy-bike/card`,
      }
      await setupHospex(tasks, settings)
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
            `setup hospex document and storage ${
              storage + 'hospex/sleepy-bike/card'
            }`}
        </li>
      </ul>
      <Button primary onClick={() => handleClickSetup()}>
        Continue!
      </Button>
    </div>
  )
}
