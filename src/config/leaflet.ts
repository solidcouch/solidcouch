import highlightedIconImage from 'highlighted-marker.svg'
import 'leaflet'
import * as L from 'leaflet'
import icon2 from 'leaflet/dist/images/marker-icon-2x.png'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import defaultIconImage from 'marker.svg'

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: icon2,
  shadowUrl: iconShadow,
})

export const tileServer =
  'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'

export const defaultIcon = L.icon({
  ...L.Icon.Default.prototype.options,
  iconUrl: defaultIconImage,
  iconRetinaUrl: defaultIconImage,
})

export const highlightedIcon = L.icon({
  ...L.Icon.Default.prototype.options,
  iconUrl: highlightedIconImage,
  iconRetinaUrl: highlightedIconImage,
})
