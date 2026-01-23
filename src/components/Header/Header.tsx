import { Logo } from '@/components/Logo/Logo.tsx'
import { ThemeSwitch } from '@/components/ThemeSwitch/ThemeSwitch'
import { defaultLocale } from '@/config'
import { useConfig } from '@/config/hooks'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { useReadMessagesFromInbox } from '@/hooks/data/useReadThreads'
import { selectAuth } from '@/redux/authSlice'
import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'
import { plural } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { FaCircle, FaRegComment, FaRegMap } from 'react-icons/fa'
import { Link } from 'react-router'
import { IconLoading } from '../IconLoading'
import { LocaleSelector } from '../LocaleSelector/LocaleSelector'
import styles from './Header.module.scss'
import { MainMenu } from './MainMenu'

export const Header = () => {
  const { communityId } = useConfig()
  const auth = useAppSelector(selectAuth)
  const locale = useAppSelector(selectLocale)
  const { t } = useLingui()

  const community = useReadCommunity(communityId, locale, defaultLocale)
  const { data: newMessages } = useReadMessagesFromInbox(auth.webId!)
  const messageCount = newMessages.length

  const messagesLabel =
    messageCount > 0
      ? t`messages (${plural(messageCount, {
          one: '# unread',
          other: '# unread',
        })})`
      : t`messages`

  return (
    <nav className={styles.header}>
      <Link to="/" data-cy="header-logo-link">
        <Logo
          logo={community.logo[0]}
          focusedLogo={community.logo[1]}
          name={community.name || (community.isLoading ? '...' : 'Home')}
          minimizeOnMobile={auth.isLoggedIn === true}
        />
      </Link>
      {auth.isLoggedIn === true && (
        <>
          <div className={styles.spacer} />
          <Link to="travel" aria-label={t`travel`}>
            <FaRegMap size={24} />
          </Link>
        </>
      )}
      <div className={styles.spacer} />
      <LocaleSelector />
      <ThemeSwitch />
      {auth.isLoggedIn === true && (
        <>
          <Link
            to="messages"
            aria-label={messagesLabel}
            className={styles.messages}
          >
            <FaRegComment size={24} />
            {messageCount > 0 ? <FaCircle className={styles.unread} /> : null}
          </Link>
          <MainMenu />
        </>
      )}
      {auth.isLoggedIn === undefined && <IconLoading />}
    </nav>
  )
}
