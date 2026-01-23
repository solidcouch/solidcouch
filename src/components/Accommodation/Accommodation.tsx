import { useConfig } from '@/config/hooks'
import { useHospexDocument } from '@/hooks/data/useCheckSetup'
import { useCreateAccommodation } from '@/hooks/data/useCreateAccommodation'
import { useDeleteAccommodation } from '@/hooks/data/useDeleteAccommodation'
import { useNotifyGeoindex } from '@/hooks/data/useNotifyGeoindex'
import { useReadAccommodation } from '@/hooks/data/useReadAccommodation'
import { useUpdateAccommodation } from '@/hooks/data/useUpdateAccommodation'
import { useAuth } from '@/hooks/useAuth'
import { GeoCoordinates, URI, type Accommodation } from '@/types'
import { getContainer } from '@/utils/helpers'
import { useLingui } from '@lingui/react/macro'
import { useCallback, useState } from 'react'
import { IconLoading } from '../IconLoading'
import { withToast } from '../withToast'
import { AccommodationForm } from './AccommodationForm'
import { AccommodationView } from './AccommodationView'

export const AccommodationCard = ({
  editable,
  uri,
  className,
}: {
  editable?: boolean
  uri: URI
  className?: string
}) => {
  const [editing, setEditing] = useState(false)

  const auth = useAuth()
  const { t } = useLingui()
  const { communityId } = useConfig()

  const [{ accommodation }, { isLoading }] = useReadAccommodation({
    accommodationId: uri,
  })

  const {
    // forCommunity: personalHospexDocuments,
    all: allHospex,
    isLoading: isHospexDocumentsLoading,
  } = useHospexDocument(auth.webId!, communityId)

  const updateAccommodation = useUpdateAccommodation()
  const deleteAccommodation = useDeleteAccommodation()
  const runNotifyGeoindex = useNotifyGeoindexHandler()

  const handleUpdate = async (
    accommodationData: Accommodation,
    previousAccommodation: Accommodation,
  ) => {
    await withToast(updateAccommodation({ data: accommodationData }), {
      pending: t`Updating accommodation`,
      success: t`Accommodation updated`,
    })

    setEditing(false)

    await runNotifyGeoindex({
      type: 'Update',
      uri: accommodationData.id,
      currentLocation: accommodationData.location,
      previousLocation: previousAccommodation.location,
    })
  }

  const handleDelete = async () => {
    const isConfirmed = globalThis.confirm(
      t`Do you really want to delete the accommodation?`,
    )

    if (isConfirmed) {
      if (!accommodation)
        throw await withToast(Promise.reject(t`Accommodation not found.`), {})
      if (isHospexDocumentsLoading)
        throw await withToast(
          Promise.reject(t`Please wait for everything to load.`),
          {},
        )

      const { id, location } = accommodation

      try {
        await withToast(
          deleteAccommodation({
            id,
            personId: auth.webId!,
            hospexDocuments: allHospex.map(h => h.hospexDocument),
          }),
          {
            pending: t`Deleting accommodation`,
            success: t`Accommodation deleted`,
          },
        )
      } finally {
        await runNotifyGeoindex({
          type: 'Delete',
          uri: id,
          previousLocation: location,
        })
      }
    }
  }

  return isLoading || !accommodation ? (
    <IconLoading />
  ) : editing ? (
    <AccommodationForm
      onSubmit={data => handleUpdate(data, accommodation)}
      onCancel={() => {
        setEditing(false)
      }}
      initialData={accommodation}
      className={className}
    />
  ) : (
    <AccommodationView
      editable={editable}
      accommodation={accommodation}
      onEdit={() => setEditing(true)}
      onDelete={async () => await handleDelete()}
      className={className}
    />
  )
}

export const NewAccommodation = ({
  onSuccess,
  onCancel,
  className,
}: {
  onSuccess: () => void
  onCancel: () => void
  className?: string
}) => {
  const { t } = useLingui()
  const { communityId } = useConfig()
  const auth = useAuth()

  const { forCommunity: personalHospexDocuments } = useHospexDocument(
    auth.webId!,
    communityId,
  )

  const createAccommodation = useCreateAccommodation()

  /**
   * notifying geoindex if it's set up with toast and stuff...
   */
  const runNotifyGeoindex = useNotifyGeoindexHandler()

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

    onSuccess()

    await runNotifyGeoindex({
      type: 'Create',
      uri,
      currentLocation: accommodation.location,
    })
  }

  return (
    <AccommodationForm
      onCancel={onCancel}
      onSubmit={handleCreate}
      className={className}
    />
  )
}

const useNotifyGeoindexHandler = () => {
  const { t } = useLingui()
  const auth = useAuth()

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
      previousLocation?: GeoCoordinates
      currentLocation?: GeoCoordinates
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

  return runNotifyGeoindex
}
