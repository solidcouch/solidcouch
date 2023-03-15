import { comunicaApi } from 'app/services/comunicaApi'
import { communityId, tileServer } from 'config'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import styles from './SearchHosts.module.scss'

export const SearchHosts = () => {
  const { data: offers } = comunicaApi.endpoints.readOffers.useQuery({
    communityId,
  })

  return (
    <div className={styles.container}>
      <MapContainer
        className={styles.mapContainer}
        attributionControl={false}
        zoom={1}
        center={[0, 0]}
        scrollWheelZoom="center"
        doubleClickZoom="center"
        touchZoom="center"
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={tileServer} />

        {offers
          ? offers.map(offer => (
              <Marker
                key={offer.id}
                position={[offer.location.lat, offer.location.long]}
              />
            ))
          : null}
      </MapContainer>
    </div>
  )
}
