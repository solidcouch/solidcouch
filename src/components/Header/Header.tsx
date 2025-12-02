import { Logo } from '@/components/Logo/Logo.tsx'
import { ThemeSwitch } from '@/components/ThemeSwitch/ThemeSwitch'
import { defaultLocale } from '@/config'
import { useConfig } from '@/config/hooks'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { selectAuth } from '@/redux/authSlice'
import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'
import { Link } from 'react-router'
import { LocaleSelector } from '../LocaleSelector/LocaleSelector'
import styles from './Header.module.scss'
import { MainMenu } from './MainMenu'

export const Header = () => {
  const { communityId } = useConfig()
  const auth = useAppSelector(selectAuth)
  const locale = useAppSelector(selectLocale)

  const community = useReadCommunity(communityId, locale, defaultLocale)

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
      <LocaleSelector />
      <ThemeSwitch />
      {auth.isLoggedIn === true && <MainMenu />}
      {auth.isLoggedIn === undefined && <>...</>}
    </nav>
  )
}
