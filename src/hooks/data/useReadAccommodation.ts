import { useConfig } from '@/config/hooks'
import { AccommodationShapeType } from '@/ldo/app.shapeTypes'
import { Accommodation, Person, URI } from '@/types'
import { getLanguages } from '@/utils/ldo'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLdhopQuery } from '@ldhop/react'
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
  const { quads, variables, isLoading } = useLdhopQuery(
    useMemo(
      () => ({
        query: accommodationQuery,
        variables: { offer: [accommodationId] },
        fetch,
      }),
      [accommodationId],
    ),
  )

  const [profile, , isProfileLoading, , hospexProfile] = useProfile(
    variables.person.values().next().value?.value ?? '',
    communityId,
  )

  const offer = useMemo(() => {
    const dataset = createLdoDataset(quads)
    const offer = dataset
      .usingType(AccommodationShapeType)
      .fromSubject(accommodationId)
    return offer
  }, [accommodationId, quads])

  const accommodationAndPerson: {
    accommodation?: Accommodation
    person?: Person
  } = useMemo(() => {
    if (!offer) return {}
    const lat = offer.location?.lat
    const long = offer.location?.long

    const accommodation: Accommodation = {
      id: offer['@id'] ?? '',
      description: getLanguages(offer, 'description'),
      location: { lat, long },
      offeredBy: offer.offeredBy?.['@id'] ?? '',
    }

    const person = profile ?? hospexProfile

    return { accommodation, person }
  }, [hospexProfile, offer, profile])

  return useMemo(
    () => [accommodationAndPerson, { isLoading, isProfileLoading }] as const,
    [accommodationAndPerson, isLoading, isProfileLoading],
  )
}
