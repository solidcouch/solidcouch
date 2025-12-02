import { URI } from '@/types'
import { hospex } from '@/utils/rdf-namespaces'
import { solid } from 'rdf-namespaces'
import { useCallback } from 'react'
import { useDeleteRdfDocument, useUpdateRdfDocument } from './useRdfDocument'

/**
 * Delete accommodation
 * Assuming the accommodation is in its own file
 * TODO generalize to delete only specified accommodation
 *   if there are multiple accommodations per file
 */
export const useDeleteAccommodation = () => {
  const updateMutation = useUpdateRdfDocument()
  const deleteMutation = useDeleteRdfDocument()
  return useCallback(
    async ({
      id,
      personId,
      hospexDocument,
    }: {
      id: URI
      personId: URI
      hospexDocument: URI
    }) => {
      await updateMutation.mutateAsync({
        uri: hospexDocument,
        patch: `
          _:mutate a <${solid.InsertDeletePatch}>;
            <${solid.deletes}> { <${personId}> <${hospex.offers}> <${id}>. }.
        `,
      })
      await deleteMutation.mutateAsync({ uri: id })
    },
    [deleteMutation, updateMutation],
  )
}

/**
 * Keep this as inspiration to delete accommodation
 * if there are multiple accommodations per document
 */
// export const useDeleteAccommodation2 = () => {
//   const queryClient = useQueryClient()
//   const updateSolidDocument = useUpdateSolidDocument()
//   const deleteSolidDocument = useDeleteSolidDocument()

//   const deleteAccommodation = async (id: URI, personalHospexDocument: URI) => {
//     const cachedAccommodationDocument = queryClient.getQueryData<string>([
//       'solidDocument',
//       removeHashFromURI(id),
//     ])
//     const cachedHospexDocument = queryClient.getQueryData<string>([
//       'solidDocument',
//       removeHashFromURI(personalHospexDocument),
//     ])
//     if (!cachedAccommodationDocument)
//       throw new Error('document to delete not fetched')
//     if (!cachedHospexDocument)
//       throw new Error('personal hospex document not fetched')

//     // remove accommodation from document
//     const ldoDataset = await parseRdf(cachedAccommodationDocument, {
//       baseIRI: id,
//     })
//     const ldo = ldoDataset.usingType(AccommodationShapeType).fromSubject(id)
//     startTransaction(ldo)
//     // manipulate dataset directly to delete whole accommodation
//     const dataset = getDataset(ldo)
//     // match locations
//     const locations = dataset.match(namedNode(id), namedNode(geo.location))
//     // remove all triples of location
//     locations.forEach(location => {
//       dataset.deleteMatches(location.object)
//     })
//     dataset.deleteMatches(namedNode(id))

//     await updateSolidDocument.mutateAsync({
//       uri: id,
//       patch: await toN3Patch(ldo),
//     })

//     commitTransaction(ldo)

//     const newDataset = getDataset(ldo)
//     if (newDataset.size === 0) {
//       // delete file
//       await deleteSolidDocument.mutateAsync({ uri: id })
//     }

//     // delete triple from personal hospex document
//     const hospexLdoDataset = await parseRdf(cachedHospexDocument, {
//       baseIRI: personalHospexDocument,
//     })
//     const hospexLdo = hospexLdoDataset
//       .usingType(HospexProfileShapeType)
//       .matchSubject(hospex.offers, id)
//     startTransaction(hospexLdo)
//     hospexLdo.forEach(hldo => {
//       hldo.offers = hldo.offers?.filter(offer => offer['@id'] !== id)
//     })
//     await updateSolidDocument.mutateAsync({
//       uri: personalHospexDocument,
//       patch: await toN3Patch(hospexLdo),
//     })
//   }

//   return deleteAccommodation
// }
