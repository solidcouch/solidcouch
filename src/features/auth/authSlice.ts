import type { ISessionInfo } from '@inrupt/solid-client-authn-browser'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { RootState } from 'app/store'

interface AuthState {
  isLoggedIn?: boolean
  webId?: string
}

const initialState: AuthState = {}

export const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signin: (state, action: PayloadAction<ISessionInfo>) => {
      state.isLoggedIn = action.payload.isLoggedIn
      state.webId = action.payload.webId
    },
  },
})

export const { actions, reducer } = slice

export const selectAuth = (state: RootState) => state.auth
