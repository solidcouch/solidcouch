import MarkerClusterGroup from '@changey/react-leaflet-markercluster'
import { LocateControl } from '@turtlesocks/react-leaflet.locatecontrol/dist/LocateControl'
import { ProgressBar } from 'components/ProgressBar/ProgressBar'
import { useConfig } from 'config/hooks'
import { useSearchAccommodations } from 'hooks/data/useSearchAccommodations'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import 'leaflet/dist/leaflet.css'
import { FaTimes } from 'react-icons/fa'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { useSearchParams } from 'react-router-dom'
import { URI } from 'types'
import { AccommodationInfo } from './AccommodationInfo'
import styles from './SearchHosts.module.scss'

export const SearchHosts = () => {
  const { communityId, defaultIcon, highlightedIcon, tileServer } = useConfig()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedAccommodationId = searchParams.get('hosting')

  const [offers, isLoading] = useSearchAccommodations(communityId)

  const handleMarkerClick = (accommodationId: URI) => {
    setSearchParams({ hosting: accommodationId })
  }

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
              ? offers.map(offer => {
                  return (
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
                          : defaultIcon
                      }
                      alt={`Accommodation offer from ${
                        offer.offeredBy?.name || offer.offeredBy?.id
                      }`}
                    />
                  )
                })
              : null}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </>
  )
}
