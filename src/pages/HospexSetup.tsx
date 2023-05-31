import { Button } from 'components'
import { Loading } from 'components/Loading/Loading'
import { communityId } from 'config'
import { useReadCommunity } from 'hooks/data/useCheckSetup'
import { useJoinGroup } from 'hooks/data/useJoinGroup'
import { useAuth } from 'hooks/useAuth'
import { useSetupHospex, useStorage } from 'hooks/useSetupHospex'
import { useState } from 'react'
import { URI } from 'types'

export const HospexSetup = ({
  isMember,
  isPublicTypeIndex,
  isPrivateTypeIndex,
  isHospexProfile,
}: {
  isMember: boolean
  isHospexProfile: boolean
  isPublicTypeIndex: boolean
  isPrivateTypeIndex: boolean
  personalHospexDocuments: URI[]
}) => {
  const auth = useAuth()
  const setupHospex = useSetupHospex()
  const storage = useStorage(auth.webId ?? '')
  const community = useReadCommunity(communityId)
  const joinGroup = useJoinGroup()
  const [isSaving, setIsSaving] = useState(false)
  const handleClickSetup = async () => {
    setIsSaving(true)
    if (!isPublicTypeIndex || !isPrivateTypeIndex || !isHospexProfile)
      await setupHospex()
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
      <ul>{!isMember && `join community ${communityId}`}</ul>
      <ul>
        {!isPublicTypeIndex &&
          `create public type index ${
            storage + 'settings/publicTypeIndex.ttl'
          }`}
      </ul>
      <ul>
        {!isPrivateTypeIndex &&
          `create private type index ${
            storage + 'settings/privateTypeIndex.ttl'
          }`}
      </ul>
      <ul>
        {!isHospexProfile &&
          `setup hospex document and storage ${
            storage + 'hospex/sleepy-bike/card'
          }`}
      </ul>
      <Button primary onClick={() => handleClickSetup()}>
        Continue!
      </Button>
    </div>
  )
}
