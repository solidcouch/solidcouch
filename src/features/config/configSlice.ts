import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../app/store.ts'
import { ConfigType } from '../../config/hooks.ts'
import * as config from '../../config/index.ts'

const initialState: Partial<ConfigType> = {}

export const slice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<Partial<typeof config>>) => {
      Object.assign(state, action.payload)
    },
    resetConfig: () => ({}),
  },
})

export const { actions, reducer } = slice

export const selectConfig = (state: RootState) => state.config
