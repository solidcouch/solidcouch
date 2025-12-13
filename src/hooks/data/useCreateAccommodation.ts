import { AccommodationShapeType } from '@/ldo/app.shapeTypes'
import { HospexProfile } from '@/ldo/app.typings'
import { Accommodation, URI } from '@/types'
import { addLanguagesToLdo } from '@/utils/ldo'
import { hospex } from '@/utils/rdf-namespaces'
import { set } from '@ldo/ldo'
import { solid } from 'rdf-namespaces'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
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
      const uid = uuidv4()
      const uri = hospexContainer + uid
      const id = `${uri}#accommodation`
      await createAccommodationMutation.mutateAsync({
        uri,
        data: {
          '@id': id,
          type: set({ '@id': 'Accommodation' }, { '@id': 'Accommodation2' }),
          location: {
            '@id': `${uri}#location`,
            type: set({ '@id': 'Point' }),
            lat: data.location.lat,
            long: data.location.long,
          },
          offeredBy: { '@id': personId } as HospexProfile,
        },
        transform: ldo => {
          // save languages of description
          addLanguagesToLdo(data.description, ldo, 'description')
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
