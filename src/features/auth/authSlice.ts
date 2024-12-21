import type { ISessionInfo } from '@inrupt/solid-client-authn-browser'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../app/store'
import type { FoafProfile } from '../../ldo/foafProfile.typings'

interface AuthState {
  isLoggedIn?: boolean
  webId?: string
  profile?: FoafProfile
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
    setUser: (state, action: PayloadAction<FoafProfile>) => {
      state.profile = action.payload
    },
    signout: state => {
      state.isLoggedIn = false
    },
  },
})

export const { actions, reducer } = slice

export const selectAuth = (state: RootState) => state.auth
