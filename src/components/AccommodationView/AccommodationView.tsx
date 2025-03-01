import { useConfig } from '@/config/hooks'
import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'
import type { Accommodation } from '@/types'
import { LatLngTuple } from 'leaflet'
import { useEffect, useMemo } from 'react'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { LocaleText } from '../LocaleText/LocaleText'
import styles from './AccommodationView.module.scss'

const CenterNewLocation = ({ location }: { location: LatLngTuple }) => {
  const map = useMap()

  useEffect(() => {
    map.flyTo(location)
  }, [location, map])

  return null
}

export const AccommodationView = (accommodation: Accommodation) => {
  const { tileServer } = useConfig()
  const locale = useAppSelector(selectLocale)

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
        dragging={false}
        keyboard={false}
      >
        <TileLayer url={tileServer} />
        <Marker position={location} />
        <CenterNewLocation location={location} />
      </MapContainer>

      <LocaleText
        className={styles.description}
        text={accommodation.description}
        locale={locale}
        as="div"
      />

      <a href={accommodation.id} target="_blank" rel="noopener noreferrer">
        <FaExternalLinkAlt />
      </a>
    </>
  )
}
