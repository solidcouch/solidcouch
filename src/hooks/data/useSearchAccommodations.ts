import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import { useQueries } from '@tanstack/react-query'
import { useConfig } from 'config/hooks'
import { AccommodationShapeType } from 'ldo/app.shapeTypes'
import { Parser, Store } from 'n3'
import ngeohash from 'ngeohash'
import { useMemo } from 'react'
import { HttpError } from 'utils/errors'
import { hospex } from 'utils/rdf-namespaces'
import { searchAccommodationsQuery } from './queries'

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

  const queries = useMemo(
    () =>
      geohashes.map(h => ({
        queryKey: ['geoindex', h],
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

  const a = useQueries({
    queries,
    combine: results => ({
      isError: results.some(r => r.isError),
      isPending: results.some(r => r.isPending),
      errors: results.filter(r => r.error).map(r => r.error!),
      data: results.filter(r => r.data).flatMap(r => r.data!),
    }),
  })

  const ldhopQueryParams = useMemo(
    () =>
      geoindexService && !a.isError
        ? { query: [], variables: {}, fetch }
        : {
            query: searchAccommodationsQuery,
            variables: { community: [communityId] },
            fetch,
            store: new Store(),
          },
    [a.isError, communityId, geoindexService],
  )

  const { quads, isMissing } = useLDhopQuery(ldhopQueryParams)

  const slowAccommodations = useMemo(() => {
    const dataset = createLdoDataset(quads)
    const accommodations = dataset
      .usingType(AccommodationShapeType)
      .matchObject(null, hospex.offers)
      .filter(a => a.location)
      .map(a => ({
        id: a['@id'] ?? '',
        description: a.description?.[0] ?? '',
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

    return [accommodations, isMissing] as const
  }, [isMissing, quads])

  const indexedAccommodations = useMemo(
    () =>
      [
        a.data.map(d => ({
          id: d.uri,
          location: {
            lat: d.location.latitude,
            long: d.location.longitude,
          },
          offeredBy: { id: '', name: '' },
        })),
        a.isPending,
      ] as const,
    [a.data, a.isPending],
  )

  return geoindexService && !a.isError
    ? indexedAccommodations
    : slowAccommodations
}
