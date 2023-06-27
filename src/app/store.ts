import {
  combineReducers,
  configureStore,
  isAnyOf,
  Reducer,
} from '@reduxjs/toolkit'
import * as authSlice from 'features/auth/authSlice'
import { rtkQueryErrorLogger } from './rtkQueryErrorLogger'
import { comunicaApi } from './services/comunicaApi'

const appReducer = combineReducers({
  auth: authSlice.reducer,
  [comunicaApi.reducerPath]: comunicaApi.reducer,
})

// clear redux state when signing out
const rootReducer: Reducer<RootState> = (state, action) => {
  if (isAnyOf(authSlice.actions.signout)(action)) {
    return appReducer(undefined, action)
  }

  return appReducer(state, action)
}

export const store = configureStore({
  reducer: rootReducer,
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  // https://redux-toolkit.js.org/rtk-query/overview#configure-the-store
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .concat(rtkQueryErrorLogger)
      .concat(comunicaApi.middleware),
})

// Infer the `RootState` and `AppDispatch` types from the store
export type RootState = ReturnType<typeof appReducer>
export type AppDispatch = typeof store.dispatch
