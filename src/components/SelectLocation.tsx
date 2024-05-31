import { LocateControl } from '@turtlesocks/react-leaflet.locatecontrol/dist/LocateControl'
import { tileServer } from 'config'
import { LatLngTuple } from 'leaflet'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import 'leaflet/dist/leaflet.css'
import React, { useCallback, useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { Location } from 'types'
import styles from './AccommodationView/AccommodationView.module.scss'

const normalizeLng = (lng: number) => (((lng % 360) - 180 * 3) % 360) + 180

const Move = ({ onChange }: { onChange?: (location: Location) => void }) => {
  const map = useMap()

  // trigger onChange callback when location changes
  const handleMove = useCallback(() => {
    const { lat, lng } = map.getCenter()
    onChange?.({ lat, long: lng })
  }, [map, onChange])

  // when move ends, move map to normal longitude, if it's out
  const handleMoveEnd = useCallback(() => {
    const { lat, lng } = map.getCenter()
    const nlng = normalizeLng(lng)
    if (Math.abs(nlng - lng) > 1) {
      map.setView([lat, nlng])
      onChange?.({ lat, long: nlng })
    }
  }, [map, onChange])

  useEffect(() => {
    map.on('move', handleMove)
    map.on('moveend', handleMoveEnd)

    return () => {
      map.off('move', handleMove)
      map.off('moveend', handleMoveEnd)
    }
  }, [handleMove, handleMoveEnd, map])

  return null
}

export const SelectLocation: React.FC<{
  value: Location
  onChange: (location: Location) => void
  isInitial?: boolean
  className?: string
}> = ({ value, onChange, isInitial }) => {
  const location = useMemo(
    () => [value.lat, value.long] as LatLngTuple,
    [value.lat, value.long],
  )

  return (
    <MapContainer
      attributionControl={false}
      center={location}
      zoom={isInitial ? 1 : 12}
      scrollWheelZoom="center"
      doubleClickZoom="center"
      touchZoom="center"
      className={styles.mapContainer}
    >
      <TileLayer url={tileServer} />
      <LocateControl
        strings={{ title: 'Select my location' }}
        showPopup={false}
        drawMarker={false}
        clickBehavior={{
          inView: 'stop',
          outOfView: 'setView',
          inViewNotFollowing: 'setView',
        }}
      />
      <Marker position={location} />
      <Move onChange={onChange} />
    </MapContainer>
  )
}
