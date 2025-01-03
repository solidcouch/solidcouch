import * as authSlice from '@/redux/authSlice'
import * as configSlice from '@/redux/configSlice'
import * as loginSlice from '@/redux/loginSlice'
import * as uiSlice from '@/redux/uiSlice'
import {
  combineReducers,
  configureStore,
  isAnyOf,
  type Reducer,
} from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const appReducer = combineReducers({
  auth: authSlice.reducer,
  login: loginSlice.reducer,
  config: configSlice.reducer,
  ui: uiSlice.reducer,
})

// clear redux state when signing out
const rootReducer: Reducer<RootState> = (state, action) => {
  if (isAnyOf(authSlice.actions.signout)(action)) {
    let resetState = appReducer(undefined, action)

    // remember previous config
    const config = state && configSlice.selectConfig(state)

    if (config)
      resetState = appReducer(resetState, configSlice.actions.setConfig(config))

    // clear state but remember last selected issuer for next login
    const lastSelectedIssuer =
      state && loginSlice.selectLastSelectedIssuer(state)
    if (lastSelectedIssuer)
      resetState = appReducer(
        resetState,
        loginSlice.actions.setLastSelectedIssuer(lastSelectedIssuer),
      )

    return resetState
  }

  return appReducer(state, action)
}

// setup redux-persist with local storage
// to keep some data across page refresh
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['login', 'config', 'ui'],
}
const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({ reducer: persistedReducer })
export const persistor = persistStore(store)

// Infer the `RootState` and `AppDispatch` types from the store
export type RootState = ReturnType<typeof appReducer>
export type AppDispatch = typeof store.dispatch
