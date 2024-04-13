import {
  combineReducers,
  configureStore,
  isAnyOf,
  Reducer,
} from '@reduxjs/toolkit'
import * as authSlice from 'features/auth/authSlice'
import * as loginSlice from 'features/login/loginSlice'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const appReducer = combineReducers({
  auth: authSlice.reducer,
  login: loginSlice.reducer,
})

// clear redux state when signing out
const rootReducer: Reducer<RootState> = (state, action) => {
  if (isAnyOf(authSlice.actions.signout)(action)) {
    const emptyState = appReducer(undefined, action)

    // clear state but remember last selected issuer for next login
    const lastSelectedIssuer =
      state && loginSlice.selectLastSelectedIssuer(state)
    if (lastSelectedIssuer)
      return appReducer(
        emptyState,
        loginSlice.actions.setLastSelectedIssuer(lastSelectedIssuer),
      )

    return emptyState
  }

  return appReducer(state, action)
}

// setup redux-persist with local storage
// to keep some data across page refresh
const persistConfig = { key: 'root', storage, whitelist: ['login'] }
const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({ reducer: persistedReducer })
export const persistor = persistStore(store)

// Infer the `RootState` and `AppDispatch` types from the store
export type RootState = ReturnType<typeof appReducer>
export type AppDispatch = typeof store.dispatch
