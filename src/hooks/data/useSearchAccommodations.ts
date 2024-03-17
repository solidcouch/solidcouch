import { fetch } from '@inrupt/solid-client-authn-browser'
import { createLdoDataset } from '@ldo/ldo'
import * as config from 'config'
import { AccommodationShapeType } from 'ldo/app.shapeTypes'
import { useMemo } from 'react'
import { hospex } from 'utils/rdf-namespaces'
import { searchAccommodationsQuery } from './queries'
import { useLDhopQuery } from './useLDhopQuery'

export const useSearchAccommodations = (communityId = config.communityId) => {
  const initial = useMemo(() => ({ community: [communityId] }), [communityId])

  const {
    variables,
    store = [],
    isLoading,
  } = useLDhopQuery({
    query: searchAccommodationsQuery,
    variables: initial,
    fetch,
  })

  return useMemo(() => {
    const dataset = createLdoDataset([...store])
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

    return [accommodations, isLoading] as const
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, variables])
}