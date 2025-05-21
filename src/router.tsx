import { createBrowserRouter, Navigate } from 'react-router'
import { App } from './App.tsx'
import { About } from './pages/About/About.tsx'
import { AuthenticatedOutlet } from './pages/AuthenticatedOutlet.tsx'
import { Contacts } from './pages/Contacts.tsx'
import { EditProfile } from './pages/EditProfile'
import { Home } from './pages/Home.tsx'
import { HostOutlet } from './pages/HostOutlet.tsx'
import { HostRedirect } from './pages/HostRedirect.tsx'
import { NewChat } from './pages/messages-new/NewChat.tsx'
import { MessagesOld } from './pages/messages-old/MessagesOld.tsx'
import { MessagesWith } from './pages/messages-with/MessagesWith.tsx'
import { Messages } from './pages/messages/Messages.tsx'
import { MyOffers } from './pages/MyOffers.tsx'
import { NotFound } from './pages/NotFound.tsx'
import { Profile } from './pages/Profile'
import { ProfileRedirect } from './pages/ProfileRedirect.tsx'
import { SearchHosts } from './pages/SearchHosts'
import { Threads } from './pages/Threads/Threads.tsx'
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
            path: 'messages-old',
            children: [
              { index: true, element: <Threads /> },
              { path: ':id', element: <MessagesOld /> },
            ],
          },
          {
            path: 'messages-with',
            children: [
              { index: true, element: <Navigate to="/messages" /> },
              {
                path: ':webId',
                children: [
                  { index: true, element: <MessagesWith /> },
                  { path: 'new', element: <NewChat /> },
                ],
              },
            ],
          },
          {
            path: 'messages',
            children: [
              { index: true, element: <Threads /> },
              { path: ':channel', element: <Messages /> },
            ],
          },
          {
            path: 'host',
            element: <HostOutlet />,
            children: [
              { index: true, element: <HostRedirect /> },
              { path: 'offers', element: <MyOffers /> },
              // { path: 'invite', element: <InvitePeople /> },
              // { path: 'guests', element: <MyGuests /> },
            ],
          },
          {
            path: 'travel',
            element: <TravelOutlet />,
            children: [
              { index: true, element: <TravelRedirect /> },
              { path: 'search', element: <SearchHosts /> },
              // { path: 'plans', element: <MyTravelPlans /> },
              // { path: 'hosts', element: <MyHosts /> },
            ],
          },
        ],
      },
      { path: 'about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
