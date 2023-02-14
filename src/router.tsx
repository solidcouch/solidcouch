import { getDefaultSession } from '@inrupt/solid-client-authn-browser'
import { App } from 'App'
import { FoafProfileFactory } from 'ldo/foafProfile.ldoFactory'
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
import { fetchWithRedirect } from 'utils/helpers'
import { ldo2json } from 'utils/ldo'

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
          {
            path: 'profile',
            element: <Profile />,
            loader: async () => {
              const webId = getDefaultSession().info.webId

              if (webId) {
                const rawProfile = await (await fetchWithRedirect(webId)).text()
                const profile = await FoafProfileFactory.parse(
                  webId,
                  rawProfile,
                  { baseIRI: webId },
                )

                return ldo2json(profile)
              }

              return null
            },
          },
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
