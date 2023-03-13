import { Point } from 'ldo/accommodation.typings'
import { LatLngTuple } from 'leaflet'
import React, { useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvent } from 'react-leaflet'
import styles from './Accommodation/Accommodation.module.scss'

const normalizeLng = (lng: number) => (((lng % 360) - 180 * 3) % 360) + 180

const LocationDrag = ({
  onDrag,
}: {
  onDrag: (location: LatLngTuple) => void
}) => {
  const map = useMapEvent('drag', () => {
    console.log('******')
    const { lat, lng } = map.getCenter()
    onDrag([lat, normalizeLng(lng)])
    map.setView([lat, normalizeLng(lng)])
  })

  return null
}

export const SelectLocation: React.FC<{
  value: Pick<Point, 'lat' | 'long'>
  onChange: (location: Pick<Point, 'lat' | 'long'>) => void
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
      <TileLayer url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png" />
      <Marker position={location} />
    </MapContainer>
  )
}
