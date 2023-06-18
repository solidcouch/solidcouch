import {
  AccommodationShapeType,
  HospexProfileShapeType,
} from 'ldo/app.shapeTypes'
import { useMemo } from 'react'
import { AccommodationExtended, URI } from 'types'
import { getContainer } from 'utils/helpers'
import { useRdfQuery } from './useRdfQuery'

const accommodationQuery = [
  [
    '?accommodationId',
    (a: string) => a,
    '?accommodation',
    AccommodationShapeType,
  ],
  // get to hospex document through a shortcut
  [
    '?accommodationId',
    (a: string) => getContainer(a) + 'card',
    '?hospexDocument',
    HospexProfileShapeType,
  ],
  ['?hospexDocument'],
  ['?accommodation', 'offeredBy', '?person'],
] as const

export const useReadAccommodation = ({
  accommodationId,
}: {
  accommodationId: URI
}) => {
  const [results, queryStatus] = useRdfQuery(accommodationQuery, {
    accommodationId,
  })
  const accommodation: AccommodationExtended | undefined = useMemo(
    () =>
      results.accommodation.length > 0
        ? {
            id: results.accommodation[0]['@id'] ?? '',
            description: results.accommodation[0].description?.[0] ?? '',
            location: results.accommodation[0].location,
            offeredBy: {
              id: results.accommodation[0].offeredBy?.['@id'] ?? '',
              name: results.accommodation[0].offeredBy?.name ?? '',
              about: results.accommodation[0].offeredBy?.note?.[0] ?? '',
              photo: results.accommodation[0].offeredBy?.hasPhoto?.['@id'],
            },
          }
        : undefined,
    [results.accommodation],
  )
  return useMemo(
    () => [accommodation, queryStatus] as const,
    [accommodation, queryStatus],
  )
}
