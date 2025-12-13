import { AccommodationShapeType } from '@/ldo/accommodation.shapeTypes'
import { Accommodation } from '@/types'
import { addLanguagesToLdo } from '@/utils/ldo'
import { useCallback } from 'react'
import type { Required } from 'utility-types'
import { useUpdateLdoDocument } from './useRdfDocument'

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
            addLanguagesToLdo(data.description, ldo, 'description')
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
