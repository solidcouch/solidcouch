import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset, languagesOf } from '@ldo/ldo'
import { useMemo } from 'react'
import { Accommodation, URI } from 'types'
import { AccommodationShapeType } from '../../ldo/app.shapeTypes'
import { readPersonAccommodationsQuery } from './queries'

/**
 * Read accommodations of a person
 */
export const useReadAccommodations = (
  personId: URI,
  communityId: URI,
  language = 'en',
) => {
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
        const descriptionLanguages = a && languagesOf(a, 'description')
        const description =
          descriptionLanguages?.[language]?.values().next().value ?? ''
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
  }, [isLoading, language, quads, variables.offer])
}
