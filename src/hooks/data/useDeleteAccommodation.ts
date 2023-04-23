import { useQueryClient } from '@tanstack/react-query'
import {
  useDeleteSolidDocument,
  useUpdateSolidDocument,
} from 'hooks/useSolidDocument'
import { commitTransaction, getDataset, parseRdf, startTransaction } from 'ldo'
import { AccommodationShapeType } from 'ldo/accommodation.shapeTypes'
import { HospexProfileShapeType } from 'ldo/hospexProfile.shapeTypes'
import { DataFactory } from 'n3'
import { URI } from 'types'
import { removeHashFromURI } from 'utils/helpers'
import { toN3Patch } from 'utils/ldo'
import { geo, hospex } from 'utils/rdf-namespaces'

const { namedNode } = DataFactory

export const useDeleteAccommodation = () => {
  const queryClient = useQueryClient()
  const updateSolidDocument = useUpdateSolidDocument()
  const deleteSolidDocument = useDeleteSolidDocument()

  const deleteAccommodation = async (id: URI, personalHospexDocument: URI) => {
    const cachedAccommodationDocument = queryClient.getQueryData<string>([
      'solidDocument',
      removeHashFromURI(id),
    ])
    const cachedHospexDocument = queryClient.getQueryData<string>([
      'solidDocument',
      removeHashFromURI(personalHospexDocument),
    ])
    if (!cachedAccommodationDocument)
      throw new Error('document to delete not fetched')
    if (!cachedHospexDocument)
      throw new Error('personal hospex document not fetched')

    // remove accommodation from document
    const ldoDataset = await parseRdf(cachedAccommodationDocument, {
      baseIRI: id,
    })
    const ldo = ldoDataset.usingType(AccommodationShapeType).fromSubject(id)
    startTransaction(ldo)
    // manipulate dataset directly to delete whole accommodation
    const dataset = getDataset(ldo)
    // match locations
    const locations = dataset.match(namedNode(id), namedNode(geo.location))
    // remove all triples of location
    locations.forEach(location => {
      dataset.deleteMatches(location.object)
    })
    dataset.deleteMatches(namedNode(id))

    await updateSolidDocument.mutateAsync({
      uri: id,
      patch: await toN3Patch(ldo),
    })

    commitTransaction(ldo)

    const newDataset = getDataset(ldo)
    if (newDataset.size === 0) {
      // delete file
      await deleteSolidDocument.mutateAsync({ uri: id })
    }

    // delete triple from personal hospex document
    const hospexLdoDataset = await parseRdf(cachedHospexDocument, {
      baseIRI: personalHospexDocument,
    })
    const hospexLdo = hospexLdoDataset
      .usingType(HospexProfileShapeType)
      .matchSubject(hospex.offers, id)
    startTransaction(hospexLdo)
    hospexLdo.forEach(hldo => {
      hldo.offers = hldo.offers?.filter(offer => offer['@id'] !== id)
    })
    await updateSolidDocument.mutateAsync({
      uri: personalHospexDocument,
      patch: await toN3Patch(hospexLdo),
    })
  }

  return deleteAccommodation
}
