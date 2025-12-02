import 'normalize.css'
import './styles/preflight.css'

import './index.scss'

import './styles/generic.scss'

import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet/dist/leaflet.css'
import './styles/form.scss'
import './styles/menu.scss'
import './styles/theme.scss'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router'
import { PersistGate } from 'redux-persist/integration/react'
import { LinguiProvider } from './components/LinguiProvider.tsx'
import './config/index.ts'
import { persistor, store } from './redux/store.ts'
import { reportWebVitals } from './reportWebVitals'
import { router } from './router.tsx'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
})

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <LinguiProvider>
            <RouterProvider router={router} />
          </LinguiProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
