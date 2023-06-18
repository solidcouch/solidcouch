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
  const accommodation: AccommodationExtended | undefined = useMemo(() => {
    if (results.accommodation.length === 0) return undefined
    const accommodation = results.accommodation[0]
    // TODO this is an inconsistency fix
    // https://github.com/o-development/ldo/issues/22#issuecomment-1590228592
    const lat = [accommodation.location?.lat].flat()[0] ?? 0
    const long = [accommodation.location?.long].flat()[0] ?? 0
    return {
      id: accommodation['@id'] ?? '',
      description: accommodation.description?.[0] ?? '',
      location: { lat, long },
      offeredBy: {
        id: accommodation.offeredBy?.['@id'] ?? '',
        name: accommodation.offeredBy?.name ?? '',
        about: accommodation.offeredBy?.note?.[0] ?? '',
        photo: accommodation.offeredBy?.hasPhoto?.['@id'],
      },
    }
  }, [results.accommodation])
  return useMemo(
    () => [accommodation, queryStatus] as const,
    [accommodation, queryStatus],
  )
}
