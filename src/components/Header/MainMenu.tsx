import { Avatar } from '@/components'
import { SignOut } from '@/components/SignOut.tsx'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { useReadMessagesFromInbox } from '@/hooks/data/useReadThreads'
import { selectAuth } from '@/redux/authSlice'
import { useAppSelector } from '@/redux/hooks'
import { selectTheme } from '@/redux/uiSlice'
import { Menu, MenuButton, MenuDivider, MenuItem } from '@szhsin/react-menu'
import { Link } from 'react-router-dom'

export const MainMenu = () => {
  const { communityId } = useConfig()
  const auth = useAppSelector(selectAuth)
  const [profile] = useProfile(auth.webId ?? '', communityId)

  const { data: newMessages } = useReadMessagesFromInbox(auth.webId ?? '')

  const theme = useAppSelector(selectTheme)

  return (
    <Menu
      menuButton={
        <MenuButton data-cy="menu-button">
          <Avatar photo={profile.photo} />
        </MenuButton>
      }
      theming={theme === 'dark' ? 'dark' : undefined}
    >
      <MenuItem>
        <Link to="profile">{profile?.name || 'profile'}</Link>
      </MenuItem>
      <MenuItem>
        <Link to="profile/edit" data-cy="menu-item-edit-profile">
          edit profile
        </Link>
      </MenuItem>
      <MenuItem>
        <Link to="messages">
          messages
          {newMessages?.length ? ` (${newMessages.length} new)` : null}
        </Link>
      </MenuItem>
      <MenuItem>
        <Link to={`profile/${encodeURIComponent(auth.webId!)}/contacts`}>
          contacts
        </Link>
      </MenuItem>
      <MenuItem>
        <Link to="host/offers">my hosting</Link>
      </MenuItem>
      <MenuDivider />
      <MenuItem>
        <SignOut />
      </MenuItem>
    </Menu>
  )
}
