import MarkerClusterGroup from '@changey/react-leaflet-markercluster'
import { ProgressBar } from 'components/ProgressBar/ProgressBar'
import { defaultIcon, highlightedIcon, tileServer } from 'config'
import { useSearchAccommodations } from 'hooks/data/useSearchAccommodations'
import { FaTimes } from 'react-icons/fa'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { useSearchParams } from 'react-router-dom'
import { URI } from 'types'
import { AccommodationInfo } from './AccommodationInfo'
import styles from './SearchHosts.module.scss'

export const SearchHosts = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedAccommodationId = searchParams.get('hosting')

  //useSearchAccommodations()

  //const offers: AccommodationExtended[] = []

  const [offers, status] = useSearchAccommodations()

  const handleMarkerClick = (accommodationId: URI) => {
    setSearchParams({ hosting: accommodationId })
  }

  return (
    <>
      {status.isLoading && <ProgressBar />}
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
