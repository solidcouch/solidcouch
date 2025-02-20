import { defaultLocale } from '@/config'
import { locales } from '@/config/locales'
import { RootState } from '@/redux/store'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  theme: 'light' | 'dark'
  locale: string
}

const getInitialLanguage = () => {
  const interfaceLanguage =
    globalThis.navigator.languages?.[0] ?? globalThis.navigator.language

  const locale =
    locales.find(l => l === interfaceLanguage) ??
    locales.find(l => interfaceLanguage.startsWith(l)) ??
    defaultLocale

  return locale
}

const initialState: UiState = {
  theme: globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light',
  locale: getInitialLanguage(),
}

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: state => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },
    changeLocale: (state, action: PayloadAction<string | undefined>) => {
      state.locale = action.payload ?? getInitialLanguage()
    },
  },
})

export const { actions, reducer } = slice

export const selectTheme = (state: RootState) => state.ui.theme
export const selectLocale = (state: RootState) => state.ui.locale
