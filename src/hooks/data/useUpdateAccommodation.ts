import { useQueryClient } from '@tanstack/react-query'
import { useUpdateSolidDocument } from 'hooks/useSolidDocument'
import { languagesOf, parseRdf, startTransaction } from 'ldo'
import { AccommodationShapeType } from 'ldo/accommodation.shapeTypes'
import { useCallback } from 'react'
import { Accommodation, URI } from 'types'
import { removeHashFromURI } from 'utils/helpers'
import { toN3Patch } from 'utils/ldo'

export const useUpdateAccommodation = () => {
  const queryClient = useQueryClient()
  const updateDocumentMutation = useUpdateSolidDocument()

  const updateAccommodation = useCallback(
    async (webId: URI, data: Accommodation) => {
      const cachedAccommodationDocument = queryClient.getQueryData<string>([
        'solidDocument',
        removeHashFromURI(data.id),
      ])

      if (!cachedAccommodationDocument)
        throw new Error('document to update not found')

      const ldoDataset = await parseRdf(cachedAccommodationDocument, {
        baseIRI: data.id,
      })
      const ldo = ldoDataset
        .usingType(AccommodationShapeType)
        .fromSubject(data.id)

      startTransaction(ldo)
      const commentLanguages = languagesOf(ldo, 'description')
      commentLanguages.en?.clear()
      commentLanguages.en?.add(data.description)
      ldo.location.lat = data.location.lat
      ldo.location.long = data.location.long

      const patch = await toN3Patch(ldo)

      await updateDocumentMutation.mutateAsync({ uri: data.id, patch })
    },
    [queryClient, updateDocumentMutation],
  )

  return updateAccommodation
}
