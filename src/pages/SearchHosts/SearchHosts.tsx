import MarkerClusterGroup from '@changey/react-leaflet-markercluster'
import { LocateControl } from '@turtlesocks/react-leaflet.locatecontrol/dist/LocateControl'
import { ProgressBar } from 'components/ProgressBar/ProgressBar'
import { Move } from 'components/SelectLocation'
import { useConfig } from 'config/hooks'
import { defaultIconGenerator, highlightedIcon } from 'config/leaflet'
import { useSearchAccommodations } from 'hooks/data/useSearchAccommodations'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import 'leaflet/dist/leaflet.css'
import isEqual from 'lodash/isEqual'
import ngeohash from 'ngeohash'
import { useCallback, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { useSearchParams } from 'react-router-dom'
import { Bounds, URI } from 'types'
import { AccommodationInfo } from './AccommodationInfo'
import styles from './SearchHosts.module.scss'

export const SearchHosts = () => {
  const { communityId, tileServer } = useConfig()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedAccommodationId = searchParams.get('hosting')

  const [bounds, setBounds] = useState<Bounds>()

  const [offers, isLoading] = useSearchAccommodations(communityId, bounds)

  const handleMarkerClick = (accommodationId: URI) => {
    setSearchParams({ hosting: accommodationId })
  }

  const handleMapUpdate = useCallback(
    (_: unknown, bounds: Bounds) =>
      setBounds(previous => (isEqual(previous, bounds) ? previous : bounds)),
    [],
  )

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
              aria-label="Close hosting preview"
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
            strings={{ title: 'My location' }}
            showPopup={false}
            clickBehavior={{
              inView: 'stop',
              outOfView: 'setView',
              inViewNotFollowing: 'setView',
            }}
          />
          <MarkerClusterGroup maxClusterRadius={20}>
            {offers
              ? offers.map(offer => (
                  <Marker
                    key={offer.id}
                    position={[offer.location.lat, offer.location.long]}
                    eventHandlers={{
                      click: () => {
                        handleMarkerClick(offer.id)
                      },
                    }}
                    icon={
                      offer.id === selectedAccommodationId
                        ? highlightedIcon
                        : defaultIconGenerator(
                            'geohash-' +
                              ngeohash.encode(
                                offer.location.lat,
                                offer.location.long,
                                10,
                              ),
                          )
                    }
                    alt={`Accommodation offer from ${
                      offer.offeredBy?.name || offer.offeredBy?.id
                    }`}
                    // data-cy={ngeohash.encode(
                    //   offer.location.lat,
                    //   offer.location.long,
                    //   10,
                    // )}
                  />
                ))
              : null}
          </MarkerClusterGroup>
          <Move onUpdate={handleMapUpdate} />
        </MapContainer>
      </div>
    </>
  )
}
