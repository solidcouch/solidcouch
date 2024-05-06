import { tileServer } from 'config'
import { LatLngTuple } from 'leaflet'
import { useEffect, useMemo } from 'react'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import type { Accommodation } from 'types'
import styles from './AccommodationView.module.scss'

const CenterNewLocation = ({ location }: { location: LatLngTuple }) => {
  const map = useMap()

  useEffect(() => {
    map.flyTo(location)
  }, [location, map])

  return null
}

export const AccommodationView = (accommodation: Accommodation) => {
  const location: LatLngTuple = useMemo(
    () => [accommodation.location.lat, accommodation.location.long],
    [accommodation.location.lat, accommodation.location.long],
  )

  return (
    <>
      <MapContainer
        className={styles.mapContainer}
        attributionControl={false}
        zoom={12}
        center={location}
        scrollWheelZoom="center"
        doubleClickZoom="center"
        touchZoom="center"
      >
        <TileLayer url={tileServer} />
        <Marker position={location} />
        <CenterNewLocation location={location} />
      </MapContainer>

      <div className={styles.description}>
        {accommodation.description}{' '}
        <a href={accommodation.id} target="_blank" rel="noopener noreferrer">
          <FaExternalLinkAlt />
        </a>
      </div>
    </>
  )
}
