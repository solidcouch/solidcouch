/*
These types are based on @types/leaflet.locatecontrol

As of writing, the package doesn't contain type for LocateControl class defined below
We copy-pasted types as it wasn't easy to export them from the original type definitions

TODO this could be updated when types match original package again

Original code:
https://github.com/DefinitelyTyped/DefinitelyTyped/blob/62176d919ccdadfead789c8820941ea97005dbd2/types/leaflet.locatecontrol/index.d.ts

Copyright (c) Denis Carriere and other contributors
https://github.com/DenisCarriere

DefinitelyTyped license (MIT):

This project is licensed under the MIT license.
Copyrights are respective of each contributor listed at the beginning of each definition file.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// TODO remove this when https://github.com/DefinitelyTyped/DefinitelyTyped/pull/71501 is published

import type { Control, ControlOptions } from 'leaflet'
import * as L from 'leaflet'

interface StringsOptions {
  title?: string | undefined
  metersUnit?: string | undefined
  feetUnit?: string | undefined
  popup?: string | undefined
  outsideMapBoundsMsg?: string | undefined
}

declare module 'leaflet.locatecontrol' {
  interface LocateOptions extends ControlOptions {
    layer?: Layer | undefined
    setView?: boolean | string | undefined
    keepCurrentZoomLevel?: boolean | undefined
    initialZoomLevel?: number | boolean | undefined
    flyTo?: boolean | undefined
    clickBehavior?: unknown
    returnToPrevBounds?: boolean | undefined
    cacheLocation?: boolean | undefined
    drawCircle?: boolean | undefined
    drawMarker?: boolean | undefined
    showCompass?: boolean | undefined
    markerClass?: unknown
    compassClass?: unknown
    circleStyle?: PathOptions | undefined
    markerStyle?: PathOptions | MarkerOptions | undefined
    compassStyle?: PathOptions | undefined
    followCircleStyle?: PathOptions | undefined
    followMarkerStyle?: PathOptions | undefined
    icon?: string | undefined
    iconLoading?: string | undefined
    iconElementTag?: string | undefined
    textElementTag?: string | undefined
    circlePadding?: number[] | undefined
    metric?: boolean | undefined
    createButtonCallback?:
      | ((
          container: HTMLDivElement,
          options: LocateOptions,
        ) => { link: HTMLAnchorElement; icon: HTMLElement })
      | undefined
    onLocationError?: ((event: ErrorEvent, control: Locate) => void) | undefined
    onLocationOutsideMapBounds?: ((control: Locate) => void) | undefined
    showPopup?: boolean | undefined
    strings?: StringsOptions | undefined
    locateOptions?: L.LocateOptions | undefined
  }
  class LocateControl extends Control {
    constructor(locateOptions?: LocateOptions)
    onAdd(map: Map): HTMLElement
    start(): void
    stop(): void
    stopFollowing(): void
    setView(): void
  }
}
