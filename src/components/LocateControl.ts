import { createControlComponent } from '@react-leaflet/core'
import {
  LocateControl as LocateControlOriginal,
  LocateOptions,
} from 'leaflet.locatecontrol'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'

export const LocateControl = createControlComponent(
  (props: LocateOptions) => new LocateControlOriginal(props),
)
