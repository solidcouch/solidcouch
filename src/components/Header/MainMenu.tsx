import { Avatar } from '@/components'
import { SignOut } from '@/components/SignOut.tsx'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { useReadMessagesFromInbox } from '@/hooks/data/useReadThreads'
import { selectAuth } from '@/redux/authSlice'
import { useAppSelector } from '@/redux/hooks'
import { selectTheme } from '@/redux/uiSlice'
import { Plural, Trans } from '@lingui/react/macro'
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
      // eslint-disable-next-line lingui/no-unlocalized-strings
      theming={theme === 'dark' ? 'dark' : undefined}
    >
      <MenuItem>
        <Link to="profile">{profile?.name || <Trans>profile</Trans>}</Link>
      </MenuItem>
      <MenuItem>
        <Link to="profile/edit" data-cy="menu-item-edit-profile">
          <Trans>edit profile</Trans>
        </Link>
      </MenuItem>
      <MenuItem>
        <Link to="messages">
          <Trans>messages</Trans>
          {newMessages?.length ? (
            <>
              {' '}
              <Plural
                value={newMessages.length}
                one="(# new)"
                other="(# new)"
              />
            </>
          ) : null}
        </Link>
      </MenuItem>
      <MenuItem>
        <Link to={`profile/${encodeURIComponent(auth.webId!)}/contacts`}>
          <Trans>contacts</Trans>
        </Link>
      </MenuItem>
      <MenuItem>
        <Link to="host/offers">
          <Trans>my hosting</Trans>
        </Link>
      </MenuItem>
      <MenuDivider />
      <MenuItem>
        <SignOut />
      </MenuItem>
    </Menu>
  )
}
