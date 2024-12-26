import { useConfig } from '@/config/hooks'
import { AccommodationShapeType } from '@/ldo/app.shapeTypes'
import { AccommodationExtended, Person, URI } from '@/types'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { useMemo } from 'react'
import { accommodationQuery } from './queries'
import { useProfile } from './useProfile'

export const useReadAccommodation = ({
  accommodationId,
}: {
  accommodationId: URI
}) => {
  const { communityId } = useConfig()
  const { quads, variables, isLoading } = useLDhopQuery(
    useMemo(
      () => ({
        query: accommodationQuery,
        variables: { offer: [accommodationId] },
        fetch,
      }),
      [accommodationId],
    ),
  )

  const [profile, , , , hospexProfile] = useProfile(
    variables.person?.[0] ?? '',
    communityId,
  )

  const offer = useMemo(() => {
    const dataset = createLdoDataset(quads)
    const offer = dataset
      .usingType(AccommodationShapeType)
      .fromSubject(accommodationId)
    return offer
  }, [accommodationId, quads])

  const accommodation: AccommodationExtended | undefined = useMemo(() => {
    if (!offer) return undefined
    const lat = offer?.location?.lat
    const long = offer?.location?.long

    const accommodation = {
      id: offer['@id'] ?? '',
      description: offer.description?.[0] ?? '',
      location: { lat, long },
      offeredBy: (profile ?? hospexProfile ?? {}) as Person,
    }
    return accommodation
  }, [hospexProfile, offer, profile])

  return useMemo(
    () => [accommodation, { isLoading }] as const,
    [accommodation, isLoading],
  )
}
