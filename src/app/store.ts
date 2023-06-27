import {
  combineReducers,
  configureStore,
  isAnyOf,
  Reducer,
} from '@reduxjs/toolkit'
import * as authSlice from 'features/auth/authSlice'

const appReducer = combineReducers({
  auth: authSlice.reducer,
})

// clear redux state when signing out
const rootReducer: Reducer<RootState> = (state, action) => {
  if (isAnyOf(authSlice.actions.signout)(action)) {
    return appReducer(undefined, action)
  }

  return appReducer(state, action)
}

export const store = configureStore({ reducer: rootReducer })

// Infer the `RootState` and `AppDispatch` types from the store
export type RootState = ReturnType<typeof appReducer>
export type AppDispatch = typeof store.dispatch
