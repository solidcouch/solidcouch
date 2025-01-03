import type { LatLngTuple, Map } from 'leaflet'
import 'leaflet.locatecontrol'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import 'leaflet/dist/leaflet.css'
import { LocateControl } from './LocateControl'

import { useConfig } from '@/config/hooks'
import { Bounds, Location } from '@/types'
import clsx from 'clsx'
import React, { useCallback, useEffect, useMemo } from 'react'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvent,
} from 'react-leaflet'
import styles from './AccommodationView/AccommodationView.module.scss'

const normalizeLng = (lng: number) => (((lng % 360) - 180 * 3) % 360) + 180

const getBounds = (map: Map) => {
  const rawBounds = map.getBounds()
  const bounds = {
    n: rawBounds.getNorth(),
    s: rawBounds.getSouth(),
    e: rawBounds.getEast(),
    w: rawBounds.getWest(),
  }

  return bounds
}

export const Move = ({
  onChange,
  onUpdate,
}: {
  onChange?: (location: Location, bounds: Bounds) => void
  onUpdate?: (location: Location, bounds: Bounds) => void
}) => {
  const map = useMap()

  // trigger onChange callback when location changes
  const handleMove = useCallback(() => {
    const { lat, lng } = map.getCenter()
    const bounds = getBounds(map)
    onChange?.({ lat, long: lng }, bounds)
  }, [map, onChange])

  // when move ends, move map to normal longitude, if it's out
  const handleMoveEnd = useCallback(() => {
    const { lat, lng } = map.getCenter()
    const nlng = normalizeLng(lng)
    const normalizedCenter = { lat, long: nlng }
    if (Math.abs(nlng - lng) > 1) {
      map.setView([lat, nlng], map.getZoom(), { animate: false })
      const bounds = getBounds(map)
      onChange?.(normalizedCenter, bounds)
    }
    const bounds = getBounds(map)
    onUpdate?.(normalizedCenter, bounds)
  }, [map, onChange, onUpdate])

  const handleLoad = useCallback(() => {
    const { lat, lng } = map.getCenter()
    const nlng = normalizeLng(lng)
    const normalizedCenter = { lat, long: nlng }
    if (Math.abs(nlng - lng) > 1) {
      map.setView([lat, nlng], map.getZoom(), { animate: false })
    }
    const bounds = getBounds(map)
    onUpdate?.(normalizedCenter, bounds)
  }, [map, onUpdate])

  useMapEvent('load', handleLoad)
  useMapEvent('move', handleMove)
  useMapEvent('moveend', handleMoveEnd)

  // this just runs as well, because 'load' doesn't typically trigger, as if the map is loaded before the hooks are hooked
  useEffect(() => {
    if (map) handleLoad()
  }, [handleLoad, map])

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
  const { tileServer } = useConfig()

  return (
    <MapContainer
      attributionControl={false}
      center={location}
      zoom={isInitial ? 1 : 12}
      scrollWheelZoom="center"
      doubleClickZoom="center"
      touchZoom="center"
      // the string class is for targeting in CI tests
      className={clsx(styles.mapContainer, 'accommodation-map-container-edit')}
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
