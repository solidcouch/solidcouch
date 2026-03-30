import { createControlComponent } from '@react-leaflet/core'
import type { LocateOptions } from 'leaflet.locatecontrol'
import { LocateControl as LocateControlOriginal } from 'leaflet.locatecontrol'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'

export const LocateControl = createControlComponent(
  (props: LocateOptions) => new LocateControlOriginal(props),
)
