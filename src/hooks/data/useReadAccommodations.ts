import { languagesOf } from 'ldo'
import {
  HospexProfileShapeType,
  SolidProfileShapeType,
} from 'ldo/app.shapeTypes'
import { HospexProfile } from 'ldo/app.typings'
import { Accommodation, URI } from 'types'
import { hospex } from 'utils/rdf-namespaces'
import { useRdfQuery } from './useRdfQuery'

const myAccommodationsQuery = [
  ['?personId', (a: URI) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
  ['?profile', 'publicTypeIndex', '?publicTypeIndex'],
  ['?publicTypeIndex', 'references', '?typeRegistration'],
  ['?typeRegistration', 'forClass', hospex.PersonalHospexDocument],
  ['?typeRegistration', 'instance', '?hospexDocument'],
  ['?hospexDocument'],
  ['?profile', (a: URI) => a, '?hospexProfile', HospexProfileShapeType],
  [
    '?hospexProfile',
    (ldo: HospexProfile, params: { communityId: URI }) =>
      ldo.memberOf?.['@id'] === params.communityId,
  ],
  ['?hospexProfile', 'offers', '?accommodation'],
  ['?accommodation'],
] as const

/**
 * Read accommodations of a person
 */
export const useReadAccommodations = (
  personId: URI,
  communityId: URI,
  language = 'en',
) => {
  const [results, queryStatus] = useRdfQuery(myAccommodationsQuery, {
    personId,
    communityId,
  })
  const accommodations: Accommodation[] = results.accommodation
    .filter(a => a.location !== undefined)
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

  return [accommodations, queryStatus] as const
}
