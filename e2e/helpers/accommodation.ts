import { dct, schema_https, solid } from 'rdf-namespaces'
import type { Person } from './account'

type AccommodationData = {
  description: { [lang: string]: string }
  location: [number, number]
}

export type AccommodationConfig = {
  id: string
  doc: string
} & AccommodationData

const accommodationTurtle = ({
  webId,
  accommodation,
}: {
  webId: string
  accommodation: AccommodationData
}) => `
@prefix : <#>.
@prefix hospex: <http://w3id.org/hospex/ns#>.
@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>.
:accommodation a hospex:Accommodation, <${schema_https.Accommodation}>;
    geo:location :location;
  ${Object.entries(accommodation.description)
    .map(
      ([language, description]) =>
        `<${dct.description}> """${description}"""@${language};`,
    )
    .join('\n')}
    hospex:offeredBy <${webId}>.
:location a geo:Point;
    geo:lat "${
      accommodation.location[0]
    }"^^<http://www.w3.org/2001/XMLSchema#decimal>;
    geo:long "${
      accommodation.location[1]
    }"^^<http://www.w3.org/2001/XMLSchema#decimal>.
`

export const addAccommodation = async (
  person: Person,
  accommodation: AccommodationData,
): Promise<AccommodationConfig> => {
  // Create the accommodation document
  const createResponse = await person.account.authFetch(
    person.pod.hospexContainer,
    {
      method: 'POST',
      headers: { 'content-type': 'text/turtle' },
      body: accommodationTurtle({
        webId: person.account.webId,
        accommodation,
      }),
    },
  )

  if (!createResponse.ok) {
    throw new Error(
      `Failed to create accommodation: ${createResponse.status} ${await createResponse.text()}`,
    )
  }

  const location = createResponse.headers.get('location')
  if (!location) {
    throw new Error(
      'No location header in response when creating accommodation',
    )
  }

  // Link the accommodation in the hospex profile
  const patchResponse = await person.account.authFetch(
    person.pod.hospexProfile,
    {
      method: 'PATCH',
      headers: { 'content-type': 'text/n3' },
      body: `@prefix hospex: <http://w3id.org/hospex/ns#>.
_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
  <${person.account.webId}> hospex:offers <${location}#accommodation>.
}.`,
    },
  )

  if (!patchResponse.ok) {
    throw new Error(
      `Failed to link accommodation in hospex profile: ${patchResponse.status} ${await patchResponse.text()}`,
    )
  }

  return {
    ...accommodation,
    id: `${location}#accommodation`,
    doc: location,
  }
}
