import './index.scss'
// this line intentionally left blank to load css reset stylesheets first
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { persistor, store } from 'app/store'
import 'config'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { router } from 'router'
import { reportWebVitals } from './reportWebVitals'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
})

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
