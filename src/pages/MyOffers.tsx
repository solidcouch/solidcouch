import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { Button, Loading } from 'components'
import { Accommodation as AccommodationView } from 'components/Accommodation/Accommodation'
import { AccommodationForm } from 'components/AccommodationForm/AccommodationForm'
import { useAuth } from 'hooks/useAuth'
import { usePersonalHospexDocuments } from 'hooks/usePersonalHospexDocuments'
import { useState } from 'react'
import { Accommodation, URI } from 'types'
import { getContainer } from 'utils/helpers'

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

  const [saveAccommodation] =
    comunicaApi.endpoints.createAccommodation.useMutation()

  if (typeof auth.webId !== 'string') return null

  if (!accommodations) return <Loading>Loading...</Loading>

  const handleCreate = async (accommodation: Accommodation) => {
    if (!(auth.webId && personalHospexDocuments?.[0]))
      throw new Error('missing variables')

    const storage = getContainer(personalHospexDocuments[0])
    const id = storage + (await crypto.randomUUID()) + '#accommodation'

    await saveAccommodation({
      webId: auth.webId,
      personalHospexDocument: personalHospexDocuments[0],
      accommodation: { ...accommodation, id },
    })

    setShowNew(false)
  }

  return (
    <div style={{ position: 'relative', zIndex: 0 /* make sure that  */ }}>
      {accommodations.map(accommodation => (
        <AccommodationView key={accommodation.id} {...accommodation} />
      ))}
      {/* <pre>{JSON.stringify(accommodations, null, 2)}</pre> */}
      {showNew ? (
        <AccommodationForm
          onSubmit={handleCreate}
          onCancel={() => setShowNew(false)}
        />
      ) : (
        <Button primary onClick={() => setShowNew(true)}>
          Add Accommodation
        </Button>
      )}
    </div>
  )
}
