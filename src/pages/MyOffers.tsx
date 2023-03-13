import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { Button, Loading } from 'components'
import { Accommodation } from 'components/Accommodation/Accommodation'
import { OfferForm } from 'components/OfferForm/OfferForm'
import { useAuth } from 'hooks/useAuth'
import { usePersonalHospexDocuments } from 'hooks/usePersonalHospexDocuments'
import { useState } from 'react'
import { URI } from 'types'

export const MyOffers = () => {
  const [showNew, setShowNew] = useState(false)
  const auth = useAuth()

  const { data: personalHospexDocuments } = usePersonalHospexDocuments(
    auth.webId,
  )

  const { data: accommodations } =
    comunicaApi.endpoints.readAccommodations.useQuery(
      auth.webId &&
        personalHospexDocuments &&
        personalHospexDocuments.length > 0
        ? {
            webId: auth.webId,
            personalHospexDocuments: personalHospexDocuments as [URI, ...URI[]],
            language: 'en',
          }
        : skipToken,
    )

  if (typeof auth.webId !== 'string') return null

  if (!accommodations) return <Loading>Loading...</Loading>

  return (
    <div>
      {accommodations.map(accommodation => (
        <Accommodation {...accommodation} />
      ))}
      <pre>{JSON.stringify(accommodations, null, 2)}</pre>
      {showNew ? (
        <OfferForm onSubmit={console.log} onCancel={() => setShowNew(false)} />
      ) : (
        <Button primary onClick={() => setShowNew(true)}>
          Add Accommodation
        </Button>
      )}
    </div>
  )
}
