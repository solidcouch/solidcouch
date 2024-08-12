import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { RootState } from 'app/store'
import * as config from 'config'

const initialState = config

export const slice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<Partial<typeof config>>) => {
      Object.assign(state, action.payload)
    },
    resetConfig: () => config,
  },
})

export const { actions, reducer } = slice

export const selectConfig = (state: RootState) => state.config
