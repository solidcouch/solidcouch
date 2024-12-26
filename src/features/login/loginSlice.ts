import { RootState } from '@/app/store'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

interface LoginState {
  lastSelectedIssuer?: string
}

const initialState: LoginState = {}

export const slice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    setLastSelectedIssuer: (state, action: PayloadAction<string>) => {
      state.lastSelectedIssuer = action.payload
    },
  },
})

export const { actions, reducer } = slice

export const selectLastSelectedIssuer = (state: RootState) =>
  state.login.lastSelectedIssuer
