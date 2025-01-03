import { RootState } from '@/redux/store'
import { createSlice } from '@reduxjs/toolkit'

interface UiState {
  theme: 'light' | 'dark'
}

const initialState: UiState = {
  theme: globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light',
}

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: state => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },
  },
})

export const { actions, reducer } = slice

export const selectTheme = (state: RootState) => state.ui.theme
