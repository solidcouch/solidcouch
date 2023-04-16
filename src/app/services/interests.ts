import { QueryEngine } from '@comunica/query-sparql/lib/index-browser'
import { foaf } from 'rdf-namespaces'
import { URI } from 'types'
import { fullFetch } from 'utils/helpers'
import { getProfileDocuments } from './generic'
import { bindings2data, query } from './helpers'

/**
 * Collect personal profile documents of person, then look for interests in them
 * person foaf:topic_interest thing.
 */

/**
 * Currently this saves interest to person's main document
 * But we may prefer to save it to some extended document
 * Or to a place where other interests already reside
 */
export const addInterest = async ({ id, person }: { id: URI; person: URI }) => {
  const engine = new QueryEngine()
  const removeInterestQuery = `INSERT DATA {
    <${person}> <${foaf.topic_interest}> <${id}>.
  }`
  await engine.queryVoid(removeInterestQuery, {
    sources: [person],
    destination: person,
    fetch: fullFetch,
  })
}

export const removeInterest = async ({
  id,
  person,
  document,
}: {
  id: URI
  person: URI
  document: URI
}) => {
  const engine = new QueryEngine()

  const removeInterestQuery = `DELETE DATA {
    <${person}> <${foaf.topic_interest}> <${id}>.
  }`

  await engine.queryVoid(removeInterestQuery, {
    sources: [document],
    destination: document,
    fetch: fullFetch,
  })
}

export const readInterests = async ({ person }: { person: URI }) => {
  const engine = new QueryEngine()
  const sources = await getProfileDocuments({ webId: person })

  const interestsQuery = query`SELECT ?interest #?label ?description
    WHERE { <${person}> <${foaf.topic_interest}> ?interest. }
  `

  const bindings = await engine.queryBindings(interestsQuery, {
    sources: [sources.primary, ...sources.extended, ...sources.hospex],
    fetch: fullFetch,
  })

  const interestUris = (await bindings2data(bindings)).map(
    ({ interest }) => interest as URI,
  )

  return interestUris
}

export const readInterestsWithDocuments = async ({
  person,
}: {
  person: URI
}): Promise<{ id: URI; document: URI }[]> => {
  const sources = await getProfileDocuments({ webId: person })

  const documents = [sources.primary, ...sources.extended, ...sources.hospex]

  const interests: { id: URI; document: URI }[] = []
  for (const document of documents) {
    const uris = await readInterestsFromDocument({ id: person, document })
    interests.push(...uris.map(id => ({ id, document })))
  }

  return interests
}

const readInterestsFromDocument = async ({
  id,
  document,
}: {
  id: URI
  document: URI
}) => {
  const engine = new QueryEngine()

  const interestsQuery = query`SELECT ?interest
    WHERE { <${id}> <${foaf.topic_interest}> ?interest. }`

  const bindings = await engine.queryBindings(interestsQuery, {
    sources: [document],
    fetch: fullFetch,
  })

  const interestUris = (await bindings2data(bindings)).map(
    ({ interest }) => interest as URI,
  )

  return interestUris
}
