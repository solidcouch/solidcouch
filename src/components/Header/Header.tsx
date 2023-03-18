import { skipToken } from '@reduxjs/toolkit/dist/query'
import { Menu, MenuButton, MenuDivider, MenuItem } from '@szhsin/react-menu'
import '@szhsin/react-menu/dist/index.css'
import '@szhsin/react-menu/dist/transitions/slide.css'
import { useAppSelector } from 'app/hooks'
import { api } from 'app/services/api'
import { Avatar } from 'components/Avatar/Avatar'
import { selectAuth } from 'features/auth/authSlice'
import { ReactComponent as LogoOpen } from 'logo-open.svg'
import { ReactComponent as Logo } from 'logo.svg'
import { Link } from 'react-router-dom'
import { SignOut } from '../SignOut'
import styles from './Header.module.scss'

export const Header = () => {
  const auth = useAppSelector(selectAuth)
  const { data: profile } = api.endpoints.readUser.useQuery(
    auth.webId ?? skipToken,
  )
  const photo = profile?.hasPhoto?.['@id'] || profile?.img

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
              <Avatar photo={photo} />
            </MenuButton>
          }
        >
          <MenuItem>
            <Link to="profile">{profile?.name ?? 'profile'}</Link>
          </MenuItem>
          <MenuItem>
            <Link to="messages">messages</Link>
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
