import { App } from 'App'
import { About } from 'pages/About'
import { AuthenticatedOutlet } from 'pages/AuthenticatedOutlet'
import { Home } from 'pages/Home'
import { HostOutlet } from 'pages/HostOutlet'
import { HostRedirect } from 'pages/HostRedirect'
import { InvitePeople } from 'pages/InvitePeople'
import { Messages } from 'pages/Messages'
import { MyGuests } from 'pages/MyGuests'
import { MyHosts } from 'pages/MyHosts'
import { MyOffers } from 'pages/MyOffers'
import { MyTravelPlans } from 'pages/MyTravelPlans'
import { NotFound } from 'pages/NotFound'
import { Profile } from 'pages/Profile'
import { SearchHosts } from 'pages/SearchHosts'
import { TravelOutlet } from 'pages/TravelOutlet'
import { TravelRedirect } from 'pages/TravelRedirect'
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <AuthenticatedOutlet />,
        children: [
          { index: true, element: <Home /> },
          { path: 'profile', element: <Profile /> },
          { path: 'messages', element: <Messages /> },
          {
            path: 'host',
            element: <HostOutlet />,
            children: [
              { index: true, element: <HostRedirect /> },
              { path: 'offers', element: <MyOffers /> },
              { path: 'invite', element: <InvitePeople /> },
              { path: 'guests', element: <MyGuests /> },
            ],
          },
          {
            path: 'travel',
            element: <TravelOutlet />,
            children: [
              { index: true, element: <TravelRedirect /> },
              { path: 'search', element: <SearchHosts /> },
              { path: 'plans', element: <MyTravelPlans /> },
              { path: 'hosts', element: <MyHosts /> },
            ],
          },
        ],
      },
      { path: 'about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
