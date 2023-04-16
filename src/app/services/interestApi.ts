import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Interest, URI } from 'types'

export const interestApi = createApi({
  reducerPath: 'interestapi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://www.wikidata.org/w/',
  }),
  tagTypes: ['Interest'],
  endpoints: build => ({
    searchInterests: build.query<
      Interest[],
      { query: string; language?: string }
    >({
      query: ({ query, language = 'en' }) => ({
        url: `api.php?action=wbsearchentities&search=${encodeURIComponent(
          query,
        )}&language=${language}&limit=20&continue=0&format=json&uselang=${language}&type=item&origin=*`,
      }),
      // Pick out data and prevent nested properties in a hook or selector
      transformResponse: (response: {
        search: {
          concepturi: string
          label: string
          description: string
          photos: []
          aliases: []
        }[]
      }) =>
        response.search.map(({ concepturi, ...rest }) => ({
          ...rest,
          id: concepturi,
        })),
      //*/
      providesTags: (result, error, query) => [
        { type: 'Interest', id: 'QUERY_STRING_' + query },
      ],
    }),
    readInterest: build.query<
      Interest | undefined,
      { id: URI; language?: string }
    >({
      query: ({ id: uri, language = 'en' }) => {
        const id = uri.match(wikidataRegex)?.[2] ?? ''
        return {
          url: `api.php?action=wbgetentities&ids=${id}&languages=${language}&format=json&origin=*`,
        }
      },
      transformResponse: (response: GetEntitiesResponse, meta, { id }) => {
        if (!response || !response.entities) return undefined

        const entity = Object.values(response.entities)[0]

        if (!entity) return undefined

        const label = entity.labels.en?.value ?? ''
        const description = entity.descriptions.en?.value ?? ''
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
        const aliases = (entity.aliases.en ?? []).map(({ value }) => value)

        return {
          id,
          label,
          aliases,
          description,
          officialWebsite,
          image: logoImage || image,
        }
      },
      providesTags: (result, error, { id }) => [{ type: 'Interest', id }],
    }),
  }),
})

const wikidataRegex =
  /^https?:\/\/(w{3}\.)?wikidata\.org\/entity\/([A-Z0-9]*)\/?$/
/*
export const getInterest = async (uri: string): Promise<Interest> => {
  const wikidataId = uri.match(wikidataRegex)?.[2] ?? ''
  const dbpediaId = uri.match(dbpediaRegex)?.[2] ?? ''
  const dataUri = wikidataId
    ? `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.ttl`
    : dbpediaId
    ? `https://dbpedia.org/data/${dbpediaId}.ttl`
    : uri
  const rawData = await (await fetchTurtle(dataUri)).text()
  return await parseInterest(rawData, uri)
}*/

interface GetEntitiesResponse {
  entities: {
    [key: string]: {
      labels: { en?: { value: string } }
      descriptions: { en?: { value: string } }
      aliases: { en?: { value: string }[] }
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
