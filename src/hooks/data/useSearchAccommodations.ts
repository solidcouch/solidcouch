import { useConfig } from '@/config/hooks'
import { AccommodationShapeType } from '@/ldo/app.shapeTypes'
import { LanguageString } from '@/types'
import { HttpError } from '@/utils/errors'
import { mergeArrays } from '@/utils/helpers'
import { getLanguages } from '@/utils/ldo'
import { hospex } from '@/utils/rdf-namespaces'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { useQueries } from '@tanstack/react-query'
import { Parser, Store } from 'n3'
import ngeohash from 'ngeohash'
import { useEffect, useMemo, useState } from 'react'
import { searchAccommodationsQuery } from './queries'
import { QueryKey } from './types'

const fetchAccommodationsByGeohash = async ({
  geohash,
  geoindex,
}: {
  geohash: string
  geoindex: string
}) => {
  const uri = new URL(
    `/query?object=${encodeURIComponent(`"${geohash}"`)}`,
    geoindex,
  ).toString()

  const response = await fetch(uri)

  if (!response.ok)
    throw new HttpError('geoindex returned invalid response', response)

  const data = await response.text()

  const parser = new Parser({
    format: response.headers.get('content-type') ?? undefined,
  })

  const quads = parser.parse(data)
  const store = new Store(quads)
  const accommodationUris = store.getSubjects(
    'https://example.com/ns#geohash',
    `"${geohash}"`,
    null,
  )

  return accommodationUris.map(uri => {
    const geohash = store
      .getObjects(uri, 'https://example.com/ns#geohash', null)
      .map(a => a.value)
      .reduce((a, b) => (a.length > b.length ? a : b))
    const location = ngeohash.decode(geohash)

    return { uri: uri.value, geohash, location }
  })
}

export const useSearchAccommodations = (
  communityId: string,
  boundaries?: { n: number; s: number; e: number; w: number },
) => {
  const { geoindexService } = useConfig()

  // if there was an error, we want to fall back to slow querying, until success shows up
  const [lastGeoindexError, setLastGeoindexError] = useState(0)
  const [lastGeoindexSucces, setLastGeoindexSuccess] = useState(0)

  const fallback = !geoindexService || lastGeoindexError > lastGeoindexSucces

  const geohashes = useMemo(
    () =>
      boundaries
        ? ngeohash.bboxes(
            boundaries.s,
            boundaries.w,
            boundaries.n,
            boundaries.e,
            1,
          )
        : [],
    [boundaries],
  )

  const geoindexQueries = useMemo(
    () =>
      geohashes.map(h => ({
        queryKey: [QueryKey.geoindex, h],
        queryFn: () =>
          fetchAccommodationsByGeohash({
            geohash: h,
            geoindex: geoindexService!,
          }),
        staleTime: Infinity,
        enabled: Boolean(geoindexService),
      })),
    [geohashes, geoindexService],
  )

  const geoindexResults = useQueries({
    queries: geoindexQueries,
    combine: results => ({
      isError: results.some(r => r.isError),
      isPending: results.some(r => r.isPending),
      isSuccess: results.every(r => r.isSuccess),
      errors: results.filter(r => r.error).map(r => r.error!),
      data: results.filter(r => r.data).flatMap(r => r.data!),
    }),
  })

  // when results flip to error, update lastError variable
  useEffect(() => {
    if (geoindexResults.isError) setLastGeoindexError(Date.now())
  }, [geoindexResults.isError])
  // when results flip to success, update lastSuccess variable
  useEffect(() => {
    if (geoindexResults.isSuccess) setLastGeoindexSuccess(Date.now())
  }, [geoindexResults.isSuccess])

  const ldhopQueryParams = useMemo(
    () =>
      fallback
        ? {
            query: searchAccommodationsQuery,
            variables: { community: [communityId] },
            fetch,
            store: new Store(),
          }
        : { query: [], variables: {}, fetch },
    [communityId, fallback],
  )

  const { quads, isMissing } = useLDhopQuery(ldhopQueryParams)

  const slowAccommodations = useMemo(() => {
    const dataset = createLdoDataset(quads)
    const accommodations = dataset
      .usingType(AccommodationShapeType)
      .matchObject(null, hospex.offers)
      .filter(a => a.location)
      .map(a => ({
        id: a['@id'],
        description: getLanguages(a, 'description'),
        // TODO this is an inconsistency fix
        // https://github.com/o-development/ldo/issues/22#issuecomment-1590228592
        location: {
          lat: [a.location.lat].flat()[0],
          long: [a.location.long].flat()[0],
        },
        offeredBy: {
          id: a.offeredBy?.['@id'] ?? '',
          name: a.offeredBy?.name ?? '',
        },
      }))
      .filter(
        (a): a is Accommodation =>
          a.location.lat !== undefined &&
          a.location.long !== undefined &&
          a.id !== undefined,
      )

    return [accommodations, isMissing] as const
  }, [isMissing, quads])

  const indexedAccommodations = useMemo(
    () =>
      [
        geoindexResults.data.map(({ uri, location }) => ({
          id: uri,
          location: {
            lat: location.latitude,
            long: location.longitude,
          },
          offeredBy: { id: '', name: '' },
        })),
        geoindexResults.isPending,
      ] as const,
    [geoindexResults.data, geoindexResults.isPending],
  )

  const mergedResults = useMemo(() => {
    const merged = mergeArrays(
      'id',
      indexedAccommodations[0],
      slowAccommodations[0],
    )
    return [merged, indexedAccommodations[1] || slowAccommodations[1]] as const
  }, [indexedAccommodations, slowAccommodations])

  return mergedResults
}

interface Accommodation {
  id: string
  description: LanguageString
  location: { lat: number; long: number }
  offeredBy: { id: string; name: string }
}
