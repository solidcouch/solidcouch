import { Interest, URI } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { merge } from 'lodash'

interface WikidataSearchResult {
  search: {
    concepturi: URI
    label: string
    description: string
    photos: []
    aliases: string[]
  }[]
}

interface WikidataEntitiesResult {
  entities: {
    [key: string]: {
      labels: { [language: string]: { value: string } }
      descriptions: { [language: string]: { value: string } }
      aliases: { [language: string]: { value: string }[] }
      claims: {
        P18?: {
          mainsnak: {
            datavalue: { value: string }
            datatype: 'commonsMedia'
          }
        }[]
        P154?: {
          mainsnak: {
            datavalue: { value: string }
            datatype: 'commonsMedia'
          }
        }[]
        P856?: {
          mainsnak: {
            datavalue: { value: string }
            datatype: 'url'
          }
        }[]
      }
    }
  }
}

export const useSearchInterests = (query: string, language = 'en') =>
  useQuery({
    queryKey: ['wikidataSearch', query, language],
    queryFn: () => searchInterests(query, language),
    enabled: !!query,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })

const searchInterests = async (
  query: string,
  language: string,
): Promise<Interest[]> => {
  const res = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      query,
    )}&language=${language}&limit=20&continue=0&format=json&uselang=${language}&type=item&origin=*`,
  )
  const data: WikidataSearchResult = await res.json()
  return data.search.map(({ concepturi, ...rest }) =>
    merge({ aliases: [], photos: [] }, { ...rest, id: concepturi }),
  )
}

export const useReadInterest = (uri: URI, language = 'en') =>
  useQuery({
    queryKey: ['wikidataEntity', uri, language],
    queryFn: () => readInterest(uri, language),
    enabled: !!uri,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })

type EmptyObject = Record<string, never>

const readInterest = async (
  uri: URI,
  language: string,
): Promise<Interest | EmptyObject> => {
  const id = uri.match(wikidataRegex)?.[2] ?? ''

  // currently, we resolve only wikidata interests
  if (!id) return {}

  const res = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&languages=${language}&format=json&origin=*`,
  )
  const data: WikidataEntitiesResult = await res.json()
  if (!data || !data.entities) return {}

  const entity = data.entities[id]

  if (!entity) return {}

  const label = entity.labels[language]?.value ?? ''
  const description = entity.descriptions[language]?.value ?? ''
  const imageString = (entity.claims.P18 ?? []).map(
    p => p.mainsnak.datavalue.value,
  )[0]
  const logoImageString = (entity.claims.P154 ?? []).map(
    p => p.mainsnak.datavalue.value,
  )[0]
  const image =
    imageString &&
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
      imageString,
    )}?width=300`

  const logoImage =
    logoImageString &&
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
      logoImageString,
    )}?width=300`
  const officialWebsite = (entity.claims.P856 ?? []).map(
    p => p.mainsnak.datavalue.value,
  )[0]
  const aliases = (entity.aliases[language] ?? []).map(({ value }) => value)

  return {
    id,
    label,
    aliases,
    description,
    officialWebsite,
    image: logoImage || image,
  }
}

const wikidataRegex =
  /^https?:\/\/(w{3}\.)?wikidata\.org\/entity\/([A-Z0-9]*)\/?$/
