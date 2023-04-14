import { QueryEngine } from '@comunica/query-sparql/lib/index-browser'
import { foaf, rdfs, schema } from 'rdf-namespaces'
import { URI } from 'types'
import { fullFetch } from 'utils/helpers'
import { getProfileDocuments } from './generic'
import { bindings2data, query } from './helpers'

/**
 * Collect personal profile documents of person, then look for interests in them
 * person foaf:topic_interest thing.
 */

export const addInterest = async ({
  person,
  interest,
}: {
  person: URI
  interest: URI
}) => {}

export const removeInterest = async ({
  person,
  interest,
}: {
  person: URI
  interest: URI
}) => {}

export const readInterests = async ({
  person,
  language = 'en',
}: {
  person: URI
  language?: string
}) => {
  const engine = new QueryEngine()
  const sources = await getProfileDocuments({ webId: person })

  const interestsQuery = query`SELECT ?interest #?label ?description
    WHERE {
    <${person}> <${foaf.topic_interest}> ?interest.
    #?interest <${rdfs.label}> ?label.
    #FILTER(lang(?label)='${language}')
    #OPTIONAL {
    #  ?interest <${schema.description}> ?description.
    #  FILTER(lang(?description)='${language}')
    #}
  }`

  const bindings = await engine.queryBindings(interestsQuery, {
    sources: [sources.primary, ...sources.extended, ...sources.hospex],
    fetch: fullFetch,
  })

  const interestUris = (await bindings2data(bindings)).map(
    ({ interest }) => interest as URI,
  )

  return interestUris
}

interface SearchResult {
  id: string
  label: string
  description: string
}

export async function searchWikidata(
  searchTerm: string,
  language: string = 'en',
): Promise<SearchResult[]> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=${language}&search=${encodeURIComponent(
    searchTerm,
  )}`
  const response = await fetch(url)
  const data = await response.json()
  return data.search.map((result: any) => ({
    id: result.concepturi,
    label: result.label,
    description: result.description,
  }))
}
