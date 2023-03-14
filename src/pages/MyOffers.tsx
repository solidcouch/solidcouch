import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { Button, Loading } from 'components'
import { Accommodation as AccommodationView } from 'components/Accommodation/Accommodation'
import { AccommodationForm } from 'components/AccommodationForm/AccommodationForm'
import { useAuth } from 'hooks/useAuth'
import { usePersonalHospexDocuments } from 'hooks/usePersonalHospexDocuments'
import { Fragment, useState } from 'react'
import { Accommodation, URI } from 'types'
import { getContainer } from 'utils/helpers'

export const MyOffers = () => {
  const [showNew, setShowNew] = useState(false)
  const auth = useAuth()

  const [editing, setEditing] = useState<URI>()

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

  const handleSave = async (accommodation: Accommodation) => {
    if (!(auth.webId && personalHospexDocuments?.[0]))
      throw new Error('missing variables')

    const id =
      accommodation.id ??
      getContainer(personalHospexDocuments[0]) +
        (await crypto.randomUUID()) +
        '#accommodation'

    await saveAccommodation({
      webId: auth.webId,
      personalHospexDocument: personalHospexDocuments[0],
      accommodation: { ...accommodation, id },
    })

    setEditing(undefined)
  }

  return (
    <div style={{ position: 'relative', zIndex: 0 /* make sure that  */ }}>
      {accommodations.map(accommodation =>
        editing === accommodation.id ? (
          <AccommodationForm
            key={accommodation.id}
            onSubmit={handleSave}
            onCancel={() => {
              setEditing(undefined)
            }}
            initialData={accommodation}
          />
        ) : (
          <Fragment key={accommodation.id}>
            <AccommodationView {...accommodation} />
            <Button
              secondary
              onClick={() => {
                setEditing(accommodation.id)
              }}
            >
              Edit
            </Button>
          </Fragment>
        ),
      )}
      <pre>{JSON.stringify(accommodations, null, 2)}</pre>
      {editing === 'new' ? (
        <AccommodationForm
          onSubmit={handleSave}
          onCancel={() => setEditing(undefined)}
        />
      ) : (
        <Button primary onClick={() => setEditing('new')}>
          Add Accommodation
        </Button>
      )}
    </div>
  )
}
