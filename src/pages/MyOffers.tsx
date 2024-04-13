import { Button, Loading } from 'components'
import { AccommodationForm } from 'components/AccommodationForm/AccommodationForm'
import { AccommodationView } from 'components/AccommodationView/AccommodationView'
import { withToast } from 'components/withToast'
import { communityId } from 'config'
import { useHospexDocumentSetup } from 'hooks/data/useCheckSetup'
import { useCreateAccommodation } from 'hooks/data/useCreateAccommodation'
import { useDeleteAccommodation } from 'hooks/data/useDeleteAccommodation'
import { useReadAccommodations } from 'hooks/data/useReadAccommodations'
import { useUpdateAccommodation } from 'hooks/data/useUpdateAccommodation'
import { useAuth } from 'hooks/useAuth'
import { useState } from 'react'
import { FaDoorOpen } from 'react-icons/fa'
import { Accommodation, URI } from 'types'
import { getContainer } from 'utils/helpers'
import styles from './MyOffers.module.scss'

export const MyOffers = () => {
  const auth = useAuth()

  const [editing, setEditing] = useState<URI | 'new'>()

  const { personalHospexDocuments } = useHospexDocumentSetup(
    auth.webId ?? '',
    communityId,
  )

  const [accommodations] = useReadAccommodations(auth.webId ?? '', communityId)

  const createAccommodation = useCreateAccommodation()
  const updateAccommodation = useUpdateAccommodation()
  const deleteAccommodation = useDeleteAccommodation()

  if (typeof auth.webId !== 'string') return null

  if (!accommodations) return <Loading>Loading...</Loading>

  const handleCreate = async (accommodation: Omit<Accommodation, 'id'>) => {
    if (!(auth.webId && personalHospexDocuments?.[0]))
      throw new Error('missing variables')

    await withToast(
      createAccommodation({
        personId: auth.webId,
        data: accommodation,
        hospexDocument: personalHospexDocuments[0],
        hospexContainer: getContainer(personalHospexDocuments[0]),
      }),
      {
        pending: 'Creating accommodation',
        success: 'Accommodation created',
      },
    )

    setEditing(undefined)
  }

  const handleUpdate = async (accommodation: Accommodation) => {
    await withToast(updateAccommodation({ data: accommodation }), {
      pending: 'Updating accommodation',
      success: 'Accommodation updated',
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
      await withToast(
        deleteAccommodation({
          id,
          personId: auth.webId,
          hospexDocument: personalHospexDocuments[0],
        }),
        {
          pending: 'Deleting accommodation',
          success: 'Accommodation deleted',
        },
      )
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>
        <FaDoorOpen size={32} /> My Accommodation Offers
      </h1>
      <ul style={{ display: 'contents' }}>
        {accommodations.map(accommodation =>
          editing === accommodation.id ? (
            <AccommodationForm
              key={accommodation.id}
              onSubmit={handleUpdate}
              onCancel={() => {
                setEditing(undefined)
              }}
              initialData={accommodation}
            />
          ) : (
            <li key={accommodation.id} className={styles.accommodation}>
              <AccommodationView {...accommodation} />
              <div className={styles.actions}>
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
            </li>
          ),
        )}
      </ul>
      {editing === 'new' ? (
        <AccommodationForm
          onSubmit={handleCreate}
          onCancel={() => setEditing(undefined)}
        />
      ) : (
        <Button
          primary
          onClick={() => setEditing('new')}
          className={styles.addAccommodationButton}
        >
          Add Accommodation
        </Button>
      )}
    </div>
  )
}
