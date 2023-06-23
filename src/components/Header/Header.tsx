import { skipToken } from '@reduxjs/toolkit/dist/query'
import { Menu, MenuButton, MenuDivider, MenuItem } from '@szhsin/react-menu'
import '@szhsin/react-menu/dist/index.css'
import '@szhsin/react-menu/dist/transitions/slide.css'
import { useAppSelector } from 'app/hooks'
import { comunicaApi } from 'app/services/comunicaApi'
import { Avatar } from 'components'
import { communityId } from 'config'
import { selectAuth } from 'features/auth/authSlice'
import { useProfile } from 'hooks/data/useProfile'
import { ReactComponent as LogoOpen } from 'logo-open.svg'
import { ReactComponent as Logo } from 'logo.svg'
import { Link } from 'react-router-dom'
import { SignOut } from '../SignOut'
import styles from './Header.module.scss'

export const Header = () => {
  const auth = useAppSelector(selectAuth)

  const [profile] = useProfile(auth.webId ?? '', communityId)

  const { data: newMessages } =
    comunicaApi.endpoints.readMessagesFromInbox.useQuery(
      auth.webId ? { me: auth.webId } : skipToken,
    )

  return (
    <nav className={styles.header}>
      <Link className={styles.logoContainer} to="/">
        <Logo className={styles.logo} />
        <LogoOpen className={styles.logoOpen} />{' '}
        {auth.isLoggedIn === false && <span>sleepy.bike</span>}
      </Link>
      <div className={styles.spacer} />
      {auth.isLoggedIn === true && (
        <Menu
          menuButton={
            <MenuButton>
              <Avatar photo={profile.photo} />
            </MenuButton>
          }
        >
          <MenuItem>
            <Link to="profile">{profile?.name || 'profile'}</Link>
          </MenuItem>
          <MenuItem>
            <Link to="messages">
              messages
              {newMessages?.length ? ` (${newMessages.length} new)` : null}
            </Link>
          </MenuItem>
          {auth.webId && (
            <MenuItem>
              <Link to={`profile/${encodeURIComponent(auth.webId)}/contacts`}>
                contacts
                {newMessages?.length ? ` (${newMessages.length} new)` : null}
              </Link>
            </MenuItem>
          )}
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
