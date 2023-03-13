import 'leaflet'
import * as L from 'leaflet'
import { LatLngTuple } from 'leaflet'
import { useMemo } from 'react'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import type { Accommodation as AccommodationType } from 'types'
import styles from './Accommodation.module.scss'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: icon, shadowUrl: iconShadow })

export const Accommodation = (accommodation: AccommodationType) => {
  const location: LatLngTuple = useMemo(
    () => [accommodation.location.latitude, accommodation.location.longitude],
    [accommodation.location.latitude, accommodation.location.longitude],
  )
  return (
    <div>
      <MapContainer
        className={styles.mapContainer}
        attributionControl={false}
        zoom={12}
        center={location}
        scrollWheelZoom="center"
        doubleClickZoom="center"
        touchZoom="center"
      >
        <TileLayer url="http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
        <Marker position={location} />
      </MapContainer>

      <div>
        {accommodation.description}{' '}
        <a href={accommodation.id} target="_blank" rel="noopener noreferrer">
          <FaExternalLinkAlt />
        </a>
      </div>
    </div>
  )
}
