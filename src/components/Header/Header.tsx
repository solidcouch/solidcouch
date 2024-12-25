import { useAppSelector } from '@/app/hooks.ts'
import { Avatar } from '@/components/index.ts'
import { Logo } from '@/components/Logo/Logo.tsx'
import { SignOut } from '@/components/SignOut.tsx'
import { useConfig } from '@/config/hooks.ts'
import { selectAuth } from '@/features/auth/authSlice.ts'
import { useReadCommunity } from '@/hooks/data/useCommunity.ts'
import { useProfile } from '@/hooks/data/useProfile.ts'
import { useReadMessagesFromInbox } from '@/hooks/data/useReadThreads.ts'
import { Menu, MenuButton, MenuDivider, MenuItem } from '@szhsin/react-menu'
import '@szhsin/react-menu/dist/index.css'
import '@szhsin/react-menu/dist/transitions/slide.css'
import { Link } from 'react-router-dom'
import styles from './Header.module.scss'

export const Header = () => {
  const { communityId } = useConfig()
  const auth = useAppSelector(selectAuth)

  const [profile] = useProfile(auth.webId ?? '', communityId)

  const { data: newMessages } = useReadMessagesFromInbox(auth.webId ?? '')

  const community = useReadCommunity(communityId)

  return (
    <nav className={styles.header}>
      <Link className={styles.logoContainer} to="/" data-cy="header-logo-link">
        <Logo
          logo={community.logo[0]}
          focusedLogo={community.logo[1]}
          name={community.name || (community.isLoading ? '...' : 'Home')}
          className={styles.logo}
        />
      </Link>
      <div className={styles.spacer} />
      {auth.isLoggedIn === true && (
        <Menu
          menuButton={
            <MenuButton data-cy="menu-button">
              <Avatar photo={profile.photo} />
            </MenuButton>
          }
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
      )}
      {auth.isLoggedIn === undefined && <>...</>}
    </nav>
  )
}
