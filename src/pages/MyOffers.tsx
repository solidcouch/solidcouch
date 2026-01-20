import { Button, Loading } from '@/components'
import { AccommodationForm } from '@/components/AccommodationForm/AccommodationForm.tsx'
import { AccommodationView } from '@/components/AccommodationView/AccommodationView.tsx'
import { withToast } from '@/components/withToast.tsx'
import { useConfig } from '@/config/hooks'
import { useHospexDocumentSetup } from '@/hooks/data/useCheckSetup'
import { useCreateAccommodation } from '@/hooks/data/useCreateAccommodation'
import { useDeleteAccommodation } from '@/hooks/data/useDeleteAccommodation'
import { useNotifyGeoindex } from '@/hooks/data/useNotifyGeoindex'
import { useReadAccommodations } from '@/hooks/data/useReadAccommodations'
import { useUpdateAccommodation } from '@/hooks/data/useUpdateAccommodation'
import { useAuth } from '@/hooks/useAuth'
import { Accommodation, Location, URI } from '@/types'
import { getContainer } from '@/utils/helpers'
import { Trans, useLingui } from '@lingui/react/macro'
import { useCallback, useState } from 'react'
import { FaDoorOpen } from 'react-icons/fa'
import styles from './MyOffers.module.scss'

export const MyOffers = () => {
  const { communityId } = useConfig()
  const auth = useAuth()
  const { t } = useLingui()

  enum EditingOption {
    new = 'new',
  }

  const [editing, setEditing] = useState<URI | EditingOption.new>()

  const { personalHospexDocuments } = useHospexDocumentSetup(
    auth.webId!,
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
            pending: t`Notifying indexing service`,
            success: {
              render: ({ data }) => {
                switch (data.status) {
                  case 201:
                    return t`Accommodation added to indexing service`
                  case 200:
                    return t`Accommodation updated in indexing service`
                  case 204:
                    return t`Accommodation removed from indexing service`
                  default:
                    return t`Unexpected status code from indexing service`
                }
              },
            },
          },
        )
    },
    [auth.webId, isGeoindexSetUp, notifyGeoindex, t],
  )

  if (typeof auth.webId !== 'string') return null

  if (!accommodations)
    return (
      <Loading>
        <Trans>Loading...</Trans>
      </Loading>
    )

  const handleCreate = async (accommodation: Omit<Accommodation, 'id'>) => {
    if (!(auth.webId && personalHospexDocuments.values().next().value))
      throw new Error(t`missing variables`)

    const hospexDocument = personalHospexDocuments.values().next().value

    const { uri } = await withToast(
      createAccommodation({
        personId: auth.webId,
        data: accommodation,
        hospexDocument: hospexDocument!.value,
        hospexContainer: getContainer(hospexDocument!.value),
      }),
      {
        pending: t`Creating accommodation`,
        success: t`Accommodation created`,
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
      pending: t`Updating accommodation`,
      success: t`Accommodation updated`,
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
    if (!(auth.webId && personalHospexDocuments.values().next().value?.value))
      throw new Error(t`missing variables`)

    const isConfirmed = globalThis.confirm(
      t`Do you really want to delete the accommodation?`,
    )

    if (isConfirmed) {
      await withToast(
        deleteAccommodation({
          id,
          personId: auth.webId,
          hospexDocument: personalHospexDocuments.values().next().value!.value,
        }),
        {
          pending: t`Deleting accommodation`,
          success: t`Accommodation deleted`,
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
        <FaDoorOpen size={32} /> <Trans>My Accommodation Offers</Trans>
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
              data-testid="offer-accommodation-item"
            >
              <AccommodationView {...accommodation} />
              <div className={styles.actions}>
                <Button
                  secondary
                  onClick={() => {
                    setEditing(accommodation.id)
                  }}
                >
                  <Trans>Edit</Trans>
                </Button>
                <Button danger onClick={() => handleDelete(accommodation)}>
                  <Trans>Delete</Trans>
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>
      {editing === EditingOption.new ? (
        <AccommodationForm
          onSubmit={handleCreate}
          onCancel={() => setEditing(undefined)}
        />
      ) : (
        <Button
          primary
          onClick={() => setEditing(EditingOption.new)}
          className={styles.addAccommodationButton}
        >
          <Trans>Add Accommodation</Trans>
        </Button>
      )}
    </div>
  )
}
