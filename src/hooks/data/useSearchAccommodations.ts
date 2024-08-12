import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { AccommodationShapeType } from 'ldo/app.shapeTypes'
import { useMemo } from 'react'
import { hospex } from 'utils/rdf-namespaces'
import { searchAccommodationsQuery } from './queries'

export const useSearchAccommodations = (communityId: string) => {
  const { quads, isMissing } = useLDhopQuery(
    useMemo(
      () => ({
        name: 'search accommodations',
        query: searchAccommodationsQuery,
        variables: { community: [communityId] },
        fetch,
      }),
      [communityId],
    ),
  )

  return useMemo(() => {
    const dataset = createLdoDataset(quads)
    const accommodations = dataset
      .usingType(AccommodationShapeType)
      .matchObject(null, hospex.offers)
      .filter(a => a.location)
      .map(a => ({
        id: a['@id'] ?? '',
        description: a.description?.[0] ?? '',
        // TODO this is an inconsistency fix
        // https://github.com/o-development/ldo/issues/22#issuecomment-1590228592
        location: {
          lat: [a.location.lat].flat()[0],
          long: [a.location.long].flat()[0],
        },
        offeredBy: {
          id: a.offeredBy?.['@id'] ?? '',
          name: a.offeredBy?.name ?? '',
        },
      }))

    return [accommodations, isMissing] as const
  }, [isMissing, quads])
}
