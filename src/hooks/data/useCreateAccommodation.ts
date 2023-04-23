import { query } from 'app/services/helpers'
import {
  useCreateSolidDocument,
  useUpdateSolidDocument,
} from 'hooks/useSolidDocument'
import {
  commitTransaction,
  createLdoDataset,
  languagesOf,
  startTransaction,
  toTurtle,
} from 'ldo'
import { AccommodationShapeType } from 'ldo/accommodation.shapeTypes'
import { useCallback } from 'react'
import { Accommodation, URI } from 'types'
import { hospex, solid } from 'utils/rdf-namespaces'

export const useCreateAccommodation = () => {
  const createDocumentMutation = useCreateSolidDocument()
  const updateDocumentMutation = useUpdateSolidDocument()

  const createAccommodation = useCallback(
    async (webId: URI, data: Accommodation, personalHospexDocument: URI) => {
      const ldoDataset = createLdoDataset()
      const ldo = ldoDataset
        .usingType(AccommodationShapeType)
        .setLanguagePreferences('en')
        .fromSubject(data.id)

      startTransaction(ldo)

      ldo.type = [{ '@id': 'Accommodation' }, { '@id': 'Accommodation2' }]
      ldo.location = {
        '@id': '#location' + crypto.randomUUID(),
        type: { '@id': 'Point' },
        lat: data.location.lat,
        long: data.location.long,
      }
      const commentLanguages = languagesOf(ldo, 'description')
      commentLanguages.en?.add(data.description)
      ldo.offeredBy = { '@id': webId }

      commitTransaction(ldo)

      const doc = await toTurtle(ldo)
      await createDocumentMutation.mutateAsync({
        uri: data.id,
        data: doc,
      })

      updateDocumentMutation.mutateAsync({
        uri: personalHospexDocument,
        patch: query`
          _:mutate a <${solid.InsertDeletePatch}>;
            <${solid.inserts}> { <${webId}> <${hospex.offers}> <${data.id}>. }.
        `,
      })
    },
    [createDocumentMutation, updateDocumentMutation],
  )

  return createAccommodation
}
