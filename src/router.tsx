import { createBrowserRouter } from 'react-router-dom'
import { App } from './App.tsx'
import { About } from './pages/About/About.tsx'
import { AuthenticatedOutlet } from './pages/AuthenticatedOutlet.tsx'
import { Contacts } from './pages/Contacts.tsx'
import { EditProfile } from './pages/EditProfile'
import { Home } from './pages/Home.tsx'
import { HostOutlet } from './pages/HostOutlet.tsx'
import { HostRedirect } from './pages/HostRedirect.tsx'
import { InvitePeople } from './pages/InvitePeople.tsx'
import { Messages } from './pages/Messages.tsx'
import { MyGuests } from './pages/MyGuests.tsx'
import { MyHosts } from './pages/MyHosts.tsx'
import { MyOffers } from './pages/MyOffers.tsx'
import { MyTravelPlans } from './pages/MyTravelPlans.tsx'
import { NotFound } from './pages/NotFound.tsx'
import { Profile } from './pages/Profile'
import { ProfileRedirect } from './pages/ProfileRedirect.tsx'
import { SearchHosts } from './pages/SearchHosts'
import { Threads } from './pages/Threads.tsx'
import { TravelOutlet } from './pages/TravelOutlet.tsx'
import { TravelRedirect } from './pages/TravelRedirect.tsx'

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
            children: [
              { index: true, element: <ProfileRedirect /> },
              { path: 'edit', element: <EditProfile /> },
              { path: ':id', element: <Profile /> },
              { path: ':id/contacts', element: <Contacts /> },
            ],
          },
          {
            path: 'messages',
            children: [
              { index: true, element: <Threads /> },
              { path: ':id', element: <Messages /> },
            ],
          },
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
