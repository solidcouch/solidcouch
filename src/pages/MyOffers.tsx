import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { Button, Loading } from 'components'
import { AccommodationForm } from 'components/AccommodationForm/AccommodationForm'
import { AccommodationView } from 'components/AccommodationView/AccommodationView'
import { useAuth } from 'hooks/useAuth'
import { usePersonalHospexDocuments } from 'hooks/usePersonalHospexDocuments'
import { useState } from 'react'
import { Accommodation, URI } from 'types'
import { getContainer } from 'utils/helpers'
import styles from './MyOffers.module.scss'

export const MyOffers = () => {
  const auth = useAuth()

  const [editing, setEditing] = useState<URI | 'new'>()

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
  const [deleteAccommodation] =
    comunicaApi.endpoints.deleteAccommodation.useMutation()

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

  const handleDelete = async (id: URI) => {
    if (!(auth.webId && personalHospexDocuments?.[0]))
      throw new Error('missing variables')

    const isConfirmed = globalThis.confirm(
      'Do you really want to delete the accommodation?',
    )

    if (isConfirmed) {
      await deleteAccommodation({
        id,
        webId: auth.webId,
        personalHospexDocument: personalHospexDocuments[0],
      })
    }
  }

  return (
    <div className={styles.container}>
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
          <div key={accommodation.id}>
            <AccommodationView {...accommodation} />
            <div>
              <Button
                secondary
                onClick={() => {
                  setEditing(accommodation.id)
                }}
              >
                Edit
              </Button>
              <Button danger onClick={() => handleDelete(accommodation.id)}>
                Delete
              </Button>
            </div>
          </div>
        ),
      )}
      {/* <pre>{JSON.stringify(accommodations, null, 2)}</pre> */}
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
