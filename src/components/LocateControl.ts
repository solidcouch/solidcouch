/*
MIT License

Copyright (c) 2024 TurtIeSocks

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// https://github.com/TurtIeSocks/react-leaflet.locatecontrol/blob/58e0ed76c572c6b37bde78f5f7238c5ee0fccf1e/src/LocateControl.ts

import 'leaflet.locatecontrol'

import { createControlComponent } from '@react-leaflet/core'
import L, { control } from 'leaflet'

export interface LocateControlProps
  extends Omit<L.Control.LocateOptions, 'position'> {
  position?: L.ControlOptions['position']
}

export const LocateControl = createControlComponent<
  L.Control.Locate,
  LocateControlProps
>(props => {
  console.log(control)
  control.locate(props)
})
