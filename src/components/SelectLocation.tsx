import { tileServer } from 'config'
import { LatLngTuple } from 'leaflet'
import React, { useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvent } from 'react-leaflet'
import { Location } from 'types'
import styles from './AccommodationView/AccommodationView.module.scss'

const normalizeLng = (lng: number) => (((lng % 360) - 180 * 3) % 360) + 180

const LocationDrag = ({
  onDrag,
}: {
  onDrag: (location: LatLngTuple) => void
}) => {
  const map = useMapEvent('drag', () => {
    const { lat, lng } = map.getCenter()
    onDrag([lat, normalizeLng(lng)])
    map.setView([lat, normalizeLng(lng)])
  })

  return null
}

export const SelectLocation: React.FC<{
  value: Location
  onChange: (location: Location) => void
  className?: string
}> = ({ value, onChange }) => {
  const location = useMemo(
    () => [value.lat, value.long] as LatLngTuple,
    [value.lat, value.long],
  )

  return (
    <MapContainer
      attributionControl={false}
      center={location}
      zoom={12}
      scrollWheelZoom="center"
      doubleClickZoom="center"
      touchZoom="center"
      className={styles.mapContainer}
    >
      <LocationDrag onDrag={([lat, long]) => onChange({ lat, long })} />
      <TileLayer url={tileServer} />
      <Marker position={location} />
    </MapContainer>
  )
}
