import { AccommodationShapeType } from '@/ldo/accommodation.shapeTypes.ts'
import { Accommodation } from '@/types/index.ts'
import { useCallback } from 'react'
import type { Required } from 'utility-types'
import { useUpdateLdoDocument } from './useRdfDocument.ts'

export const useUpdateAccommodation = () => {
  const updateMutation = useUpdateLdoDocument(AccommodationShapeType)
  return useCallback(
    async ({
      data: { id, ...data },
      language = 'en',
    }: {
      data: Required<Partial<Accommodation>, 'id'>
      language?: string
    }) => {
      await updateMutation.mutateAsync({
        uri: id,
        subject: id,
        language,
        transform: ldo => {
          if (data.description) {
            ldo.description = [data.description]
          }
          if (data.location) {
            ldo.location.lat = data.location.lat
            ldo.location.long = data.location.long
          }
        },
      })
    },
    [updateMutation],
  )
}
