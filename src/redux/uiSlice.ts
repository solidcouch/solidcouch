import { defaultLocale } from '@/config'
import { locales } from '@/config/locales'
import { RootState } from '@/redux/store'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  theme: 'light' | 'dark'
  locale: string
  onboarding: number
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
  onboarding: Infinity,
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
    setOnboarding: (state, action: PayloadAction<number>) => {
      state.onboarding = action.payload
    },
    setOnboardingNext: state => {
      state.onboarding++
    },
  },
})

export const { actions, reducer } = slice

export const selectTheme = (state: RootState) => state.ui.theme
export const selectLocale = (state: RootState) => state.ui.locale
