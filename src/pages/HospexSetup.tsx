import { comunicaApi } from 'app/services/comunicaApi'
import { Button } from 'components'
import { Loading } from 'components/Loading/Loading'
import { useSetupHospex } from 'hooks/useSetupHospex'
import { useState } from 'react'
import { URI } from 'types'

export const HospexSetup = ({
  setup,
  join,
  joinData,
}: {
  setup: boolean
  join: boolean
  joinData?: {
    webId: URI
    communityId: URI
    personalHospexDocument: URI
    storage: URI
  }
}) => {
  const setupHospex = useSetupHospex()
  const [joinCommunity] = comunicaApi.endpoints.joinCommunity.useMutation()
  const [isSaving, setIsSaving] = useState(false)
  const handleClickSetup = async () => {
    setIsSaving(true)
    if (setup) await setupHospex()
    if (join && joinData) await joinCommunity(joinData)
    setIsSaving(false)
  }

  if (isSaving) return <Loading>Preparing your Pod...</Loading>

  return (
    <div>
      <header>Welcome to sleepy.bike!</header>
      <div>We would like to set up your Pod.</div>
      <Button primary onClick={() => handleClickSetup()}>
        Continue!
      </Button>
    </div>
  )
}
