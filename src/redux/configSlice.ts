import * as config from '@/config'
import { ConfigType } from '@/config/hooks'
import { RootState } from '@/redux/store'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

const initialState: Partial<ConfigType> = {}

const slice = createSlice({
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
