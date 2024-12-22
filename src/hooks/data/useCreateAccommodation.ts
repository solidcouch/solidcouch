import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { AccommodationShapeType } from '../../ldo/app.shapeTypes.ts'
import { HospexProfile } from '../../ldo/app.typings.ts'
import { Accommodation, URI } from '../../types/index.ts'
import { hospex, solid } from '../../utils/rdf-namespaces.ts'
import { useCreateRdfDocument, useUpdateRdfDocument } from './useRdfDocument.ts'

export const useCreateAccommodation = () => {
  const createAccommodationMutation = useCreateRdfDocument(
    AccommodationShapeType,
  )
  const updateMutation = useUpdateRdfDocument()

  return useCallback(
    async ({
      personId,
      data,
      hospexDocument,
      hospexContainer,
    }: {
      personId: URI
      data: Omit<Accommodation, 'id'>
      hospexDocument: URI
      hospexContainer: URI
    }) => {
      const uid = uuidv4()
      const uri = hospexContainer + uid
      const id = `${uri}#accommodation`
      await createAccommodationMutation.mutateAsync({
        uri,
        data: {
          '@id': id,
          type: [{ '@id': 'Accommodation' }, { '@id': 'Accommodation2' }],
          description: [data.description],
          location: {
            '@id': `${uri}#location`,
            type: { '@id': 'Point' },
            lat: data.location.lat,
            long: data.location.long,
          },
          offeredBy: { '@id': personId } as HospexProfile,
        },
      })
      await updateMutation.mutateAsync({
        uri: hospexDocument,
        patch: `
          _:mutate a <${solid.InsertDeletePatch}>;
            <${solid.inserts}> { <${personId}> <${hospex.offers}> <${id}>. }.
        `,
      })

      return { uri: id }
    },
    [createAccommodationMutation, updateMutation],
  )
}
