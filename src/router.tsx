import { AuthenticatedOutlet } from 'pages/AuthenticatedOutlet'
import { Home } from 'pages/Home'
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthenticatedOutlet />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
])
