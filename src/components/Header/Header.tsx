import { Menu, MenuButton, MenuDivider, MenuItem } from '@szhsin/react-menu'
import '@szhsin/react-menu/dist/index.css'
import '@szhsin/react-menu/dist/transitions/slide.css'
import { useAppSelector } from 'app/hooks'
import { selectAuth } from 'features/auth/authSlice'
import { ReactComponent as LogoOpen } from 'logo-open.svg'
import { ReactComponent as Logo } from 'logo.svg'
import { FaUserCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { SignOut } from '../SignOut'
import styles from './Header.module.scss'

export const Header = () => {
  const auth = useAppSelector(selectAuth)
  const photo = auth.profile?.img || auth.profile?.hasPhoto?.['@id']

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
              {photo ? (
                <img className={styles.photo} src={photo} alt="" />
              ) : (
                <FaUserCircle className={styles.photo} size={32} />
              )}
            </MenuButton>
          }
        >
          <MenuItem>
            <Link to="profile">{auth.profile?.name ?? 'profile'}</Link>
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
