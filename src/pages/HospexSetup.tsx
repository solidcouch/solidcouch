import { Button } from 'components'
import { Loading } from 'components/Loading/Loading'
import { useSetupHospex } from 'hooks/useSetupHospex'
import { useState } from 'react'

export const HospexSetup = () => {
  const setupHospex = useSetupHospex()
  const [isSaving, setIsSaving] = useState(false)
  const handleClickSetup = async () => {
    setIsSaving(true)
    await setupHospex()
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
