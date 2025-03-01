import { AccommodationShapeType } from '@/ldo/app.shapeTypes'
import { Accommodation, URI } from '@/types'
import { getLanguages } from '@/utils/ldo'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { useMemo } from 'react'
import { readPersonAccommodationsQuery } from './queries'

/**
 * Read accommodations of a person
 */
export const useReadAccommodations = (personId: URI, communityId: URI) => {
  const { variables, quads, isLoading } = useLDhopQuery({
    query: readPersonAccommodationsQuery,
    variables: useMemo(
      () => ({ person: [personId], community: [communityId] }),
      [communityId, personId],
    ),
    fetch,
  })

  return useMemo(() => {
    const dataset = createLdoDataset(quads)
    const offerIds = variables.offer ?? []

    const accommodations: Accommodation[] = offerIds
      .map(offerId =>
        dataset.usingType(AccommodationShapeType).fromSubject(offerId),
      )
      .filter(
        a => a?.location?.lat !== undefined && a?.location?.long !== undefined,
      )
      .map(a => {
        const description = getLanguages(a, 'description')
        // TODO this is an inconsistency fix
        // https://github.com/o-development/ldo/issues/22#issuecomment-1590228592
        const lat = [a.location.lat].flat()[0] ?? 0
        const long = [a.location.long].flat()[0] ?? 0
        return {
          id: a['@id'] ?? '',
          description,
          location: { lat, long },
          offeredBy: a.offeredBy?.['@id'] ?? '',
        }
      })

    return [accommodations, isLoading] as const
  }, [isLoading, quads, variables.offer])
}
