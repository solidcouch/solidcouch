import { LocateControl } from '@/components/LocateControl.ts'
import { ProgressBar } from '@/components/ProgressBar/ProgressBar.tsx'
import { Move } from '@/components/SelectLocation.tsx'
import { useConfig } from '@/config/hooks'
import { defaultIconGenerator, highlightedIcon } from '@/config/leaflet'
import { useSearchAccommodations } from '@/hooks/data/useSearchAccommodations'
import { Bounds, URI } from '@/types'
import { useLingui } from '@lingui/react/macro'
import 'leaflet/dist/leaflet.css'
import isEqual from 'lodash/isEqual'
import ngeohash from 'ngeohash'
import { useCallback, useMemo, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
import { useSearchParams } from 'react-router'
import { AccommodationInfo } from './AccommodationInfo.tsx'
import styles from './SearchHosts.module.scss'

export const SearchHosts = () => {
  const { t } = useLingui()
  const { communityId, tileServer } = useConfig()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedAccommodationId = searchParams.get('hosting')

  const [bounds, setBounds] = useState<Bounds>()

  const [offers, isLoading] = useSearchAccommodations(communityId, bounds)

  const handleMarkerClick = useCallback(
    (accommodationId: URI) => {
      setSearchParams({ hosting: accommodationId })
    },
    [setSearchParams],
  )

  const handleMapUpdate = useCallback(
    (_: unknown, bounds: Bounds) =>
      setBounds(previous => (isEqual(previous, bounds) ? previous : bounds)),
    [],
  )

  const markers = useMemo(() => {
    if (!offers) return null
    return offers.map(offer => {
      const offeredByIdentifier = offer.offeredBy?.name || offer.offeredBy?.id

      return (
        <Marker
          key={offer.id}
          position={[offer.location.lat, offer.location.long]}
          eventHandlers={{
            click: () => {
              handleMarkerClick(offer.id)
            },
            keypress: event => {
              // eslint-disable-next-line lingui/no-unlocalized-strings
              if ([' ', 'Enter'].includes(event.originalEvent.key))
                handleMarkerClick(offer.id)
            },
          }}
          icon={
            offer.id === selectedAccommodationId
              ? highlightedIcon
              : defaultIconGenerator(
                  // eslint-disable-next-line lingui/no-unlocalized-strings
                  'geohash-' +
                    ngeohash.encode(
                      offer.location.lat,
                      offer.location.long,
                      10,
                    ),
                )
          }
          alt={t`Accommodation offer from ${offeredByIdentifier}`}
        />
      )
    })
  }, [handleMarkerClick, offers, selectedAccommodationId, t])

  return (
    <>
      {isLoading && <ProgressBar />}
      <div className={styles.container}>
        {selectedAccommodationId && (
          <div className={styles.offerOverlay}>
            <button
              onClick={() => {
                setSearchParams({})
              }}
              className={styles.closeButton}
              aria-label={t`Close hosting preview`}
            >
              <FaTimes />
            </button>
            <AccommodationInfo accommodationId={selectedAccommodationId} />
          </div>
        )}
        <MapContainer
          className={styles.mapContainer}
          attributionControl={false}
          zoom={1}
          center={[0, 0]}
        >
          <TileLayer url={tileServer} />
          <LocateControl
            strings={{ title: t`My location` }}
            showPopup={false}
            clickBehavior={{
              inView: 'stop',
              outOfView: 'setView',
              inViewNotFollowing: 'setView',
            }}
          />
          <MarkerClusterGroup maxClusterRadius={20}>
            {markers}
          </MarkerClusterGroup>
          <Move onUpdate={handleMapUpdate} />
        </MapContainer>
      </div>
    </>
  )
}
