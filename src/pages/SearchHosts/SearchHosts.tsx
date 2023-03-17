import { comunicaApi } from 'app/services/comunicaApi'
import { communityId, tileServer } from 'config'
import { FaTimes } from 'react-icons/fa'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { useSearchParams } from 'react-router-dom'
import { URI } from 'types'
import { AccommodationInfo } from './AccommodationInfo'
import styles from './SearchHosts.module.scss'

export const SearchHosts = () => {
  const { data: offers } = comunicaApi.endpoints.readOffers.useQuery({
    communityId,
  })

  const [searchParams, setSearchParams] = useSearchParams()

  const selectedAccommodationId = searchParams.get('hosting')

  const handleMarkerClick = (accommodationId: URI) => {
    setSearchParams({ hosting: accommodationId })
  }

  return (
    <>
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
          scrollWheelZoom="center"
          doubleClickZoom="center"
          touchZoom="center"
        >
          <TileLayer url={tileServer} />

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
                />
              ))
            : null}
        </MapContainer>
      </div>
    </>
  )
}
