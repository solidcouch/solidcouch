import { AccommodationShapeType } from 'ldo/app.shapeTypes'
import { HospexProfile } from 'ldo/app.typings'
import { useCallback } from 'react'
import { Accommodation, URI } from 'types'
import { hospex, solid } from 'utils/rdf-namespaces'
import * as uuid from 'uuid'
import { useCreateRdfDocument, useUpdateRdfDocument } from './useRdfDocument'

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
      const uid = uuid.v4()
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
    },
    [createAccommodationMutation, updateMutation],
  )
}
