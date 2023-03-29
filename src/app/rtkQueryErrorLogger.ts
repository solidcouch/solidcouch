/* eslint-disable no-console */
import type { Middleware /*, MiddlewareAPI*/ } from '@reduxjs/toolkit'
import { isRejectedWithValue } from '@reduxjs/toolkit'

/**
 * Log error in console as warning
 * https://redux-toolkit.js.org/rtk-query/usage/error-handling#handling-errors-at-a-macro-level
 */
export const rtkQueryErrorLogger: Middleware =
  (/*api: MiddlewareAPI*/) => next => action => {
    // RTK Query uses `createAsyncThunk` from redux-toolkit under the hood, so we're able to utilize these matchers!
    if (isRejectedWithValue(action)) {
      console.warn('We got a rejected action!')
      console.warn({
        title: 'Async error!',
        message: action.error.data.message,
      })
    }

    return next(action)
  }
