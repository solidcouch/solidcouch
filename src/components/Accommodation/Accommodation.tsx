import { useConfig } from '@/config/hooks'
import { useHospexDocument } from '@/hooks/data/useCheckSetup'
import { useCreateAccommodation } from '@/hooks/data/useCreateAccommodation'
import { useNotifyGeoindex } from '@/hooks/data/useNotifyGeoindex'
import { useReadAccommodation } from '@/hooks/data/useReadAccommodation'
import { useAuth } from '@/hooks/useAuth'
import { GeoCoordinates, URI, type Accommodation } from '@/types'
import { getContainer } from '@/utils/helpers'
import { useLingui } from '@lingui/react/macro'
import { useCallback, useState } from 'react'
import { AccommodationForm } from '../AccommodationForm/AccommodationForm'
import { AccommodationView } from '../AccommodationView/AccommodationView'
import { IconLoading } from '../IconLoading'
import { withToast } from '../withToast'

export const AccommodationItem = ({
  editable,
  uri,
}: {
  editable?: boolean
  uri: URI
}) => {
  const [editing, setEditing] = useState(false)

  const [{ accommodation }, { isLoading }] = useReadAccommodation({
    accommodationId: uri,
  })

  const handleFormSubmit = () => {}

  return isLoading || !accommodation ? (
    <IconLoading />
  ) : editing ? (
    <AccommodationForm
      onSubmit={handleFormSubmit}
      onCancel={() => {
        setEditing(false)
      }}
      initialData={accommodation}
    />
  ) : (
    <AccommodationView editable={editable} accommodation={accommodation} />
  )
}

export const NewAccommodation = ({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) => {
  const { t } = useLingui()
  const { communityId } = useConfig()
  const auth = useAuth()

  const { forCommunity: personalHospexDocuments } = useHospexDocument(
    auth.webId!,
    communityId,
  )

  const createAccommodation = useCreateAccommodation()
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

  return <AccommodationForm onCancel={onCancel} onSubmit={handleCreate} />
}
