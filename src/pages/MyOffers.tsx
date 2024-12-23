import { useCallback, useState } from 'react'
import { FaDoorOpen } from 'react-icons/fa'
import { AccommodationForm } from '../components/AccommodationForm/AccommodationForm.tsx'
import { AccommodationView } from '../components/AccommodationView/AccommodationView.tsx'
import { Button, Loading } from '../components/index.ts'
import { withToast } from '../components/withToast.tsx'
import { useConfig } from '../config/hooks.ts'
import { useHospexDocumentSetup } from '../hooks/data/useCheckSetup.ts'
import { useCreateAccommodation } from '../hooks/data/useCreateAccommodation.ts'
import { useDeleteAccommodation } from '../hooks/data/useDeleteAccommodation.ts'
import { useNotifyGeoindex } from '../hooks/data/useNotifyGeoindex.ts'
import { useReadAccommodations } from '../hooks/data/useReadAccommodations.ts'
import { useUpdateAccommodation } from '../hooks/data/useUpdateAccommodation.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { Accommodation, Location, URI } from '../types/index.ts'
import { getContainer } from '../utils/helpers.ts'
import styles from './MyOffers.module.scss'

export const MyOffers = () => {
  const { communityId } = useConfig()
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

  const [isGeoindexSetUp, notifyGeoindex] = useNotifyGeoindex()

  /**
   * notifying geoindex if it's set up with toast and stuff...
   */
  const runNotifyGeoindex = useCallback(
    async ({
      uri,
      type,
      previousLocation,
      currentLocation,
    }: {
      uri: string
      type: 'Create' | 'Update' | 'Delete'
      previousLocation?: Location
      currentLocation?: Location
    }) => {
      if (isGeoindexSetUp && auth.webId)
        await withToast(
          notifyGeoindex({
            type,
            actor: auth.webId,
            object: uri,
            previousLocation,
            currentLocation,
          }),
          {
            pending: 'Notifying indexing service',
            success: {
              render: ({ data }) => {
                switch (data.status) {
                  case 201:
                    return <>Accommodation added to indexing service</>
                  case 200:
                    return <>Accommodation updated in indexing service</>
                  case 204:
                    return <>Accommodation removed from indexing service</>
                  default:
                    return <>Unexpected status code from indexing service</>
                }
              },
            },
          },
        )
    },
    [auth.webId, isGeoindexSetUp, notifyGeoindex],
  )

  if (typeof auth.webId !== 'string') return null

  if (!accommodations) return <Loading>Loading...</Loading>

  const handleCreate = async (accommodation: Omit<Accommodation, 'id'>) => {
    if (!(auth.webId && personalHospexDocuments?.[0]))
      throw new Error('missing variables')

    const { uri } = await withToast(
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

    await runNotifyGeoindex({
      type: 'Create',
      uri,
      currentLocation: accommodation.location,
    })
  }

  const handleUpdate = async (
    accommodation: Accommodation,
    previousAccommodation: Accommodation,
  ) => {
    await withToast(updateAccommodation({ data: accommodation }), {
      pending: 'Updating accommodation',
      success: 'Accommodation updated',
    })
    setEditing(undefined)

    await runNotifyGeoindex({
      type: 'Update',
      uri: accommodation.id,
      currentLocation: accommodation.location,
      previousLocation: previousAccommodation.location,
    })
  }

  const handleDelete = async ({ id, location }: Accommodation) => {
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

      await runNotifyGeoindex({
        type: 'Delete',
        uri: id,
        previousLocation: location,
      })
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
              onSubmit={a => handleUpdate(a, accommodation)}
              onCancel={() => {
                setEditing(undefined)
              }}
              initialData={accommodation}
            />
          ) : (
            <li
              key={accommodation.id}
              className={styles.accommodation}
              data-cy="offer-accommodation-item"
            >
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
                <Button danger onClick={() => handleDelete(accommodation)}>
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
