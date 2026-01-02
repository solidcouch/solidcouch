import { ButtonLink, Interests, Loading } from '@/components'
import { ExternalLink } from '@/components/Button/Button.tsx'
import { SharedInterests } from '@/components/Interests/Interests.tsx'
import { LocaleText } from '@/components/LocaleText/LocaleText.tsx'
import { ProtectedImg } from '@/components/ProtectedImg.tsx'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/redux/hooks.ts'
import { selectLocale } from '@/redux/uiSlice.ts'
import { URI } from '@/types/index.ts'
import { Trans, useLingui } from '@lingui/react/macro'
import clsx from 'clsx'
import { FaPencilAlt } from 'react-icons/fa'
import { useParams } from 'react-router'
import encodeURIComponent from 'strict-uri-encode'
import { ManageContact } from './ManageContact.tsx'
import styles from './Profile.module.scss'

export const ProfilePage = () => {
  const personId = useParams().id as string
  return <Profile webId={personId} />
}

export const Profile = ({
  webId,
  readonly,
  imageClassName,
}: {
  webId: URI
  readonly?: boolean
  imageClassName?: string
}) => {
  const { t } = useLingui()
  const auth = useAuth()
  const isMe = webId && auth.webId ? webId === auth.webId : undefined
  const locale = useAppSelector(selectLocale)

  const { communityId } = useConfig()
  const [profile] = useProfile(webId, communityId)

  const name = profile.name

  return (
    <div className={styles.container}>
      <ProtectedImg
        className={clsx(styles.photo, imageClassName)}
        src={profile.photo}
        alt={t`Profile photo of ${name}`}
        data-cy="profile-photo"
      />
      <header className={styles.name} data-cy="profile-name">
        {profile.name}
      </header>
      <ExternalLink className={styles.webid} href={webId}>
        {webId}
      </ExternalLink>
      <LocaleText
        text={profile.about}
        locale={locale}
        className={styles.about}
        data-cy={`profile-about`}
      />
      {!readonly && isMe && (
        <ButtonLink secondary to="/profile/edit" data-cy="edit-profile-link">
          <FaPencilAlt /> <Trans>edit profile</Trans>
        </ButtonLink>
      )}
      {!readonly && isMe === false && (
        <ButtonLink
          secondary
          to={{
            pathname: '/messages',
            search: `?with=${encodeURIComponent(webId)}`,
          }}
        >
          <Trans>Write a message</Trans>
        </ButtonLink>
      )}
      {!readonly && (
        <ButtonLink
          tertiary
          to={`/profile/${encodeURIComponent(webId)}/contacts`}
        >
          <Trans>contacts</Trans>
        </ButtonLink>
      )}
      {!readonly && isMe === false && <ManageContact webId={webId} />}
      <section>
        {profile.interests ? (
          isMe ? (
            <Interests ids={profile.interests} />
          ) : (
            <SharedInterests ids={profile.interests} />
          )
        ) : (
          <Loading>
            <Trans>loading interests...</Trans>
          </Loading>
        )}
      </section>
    </div>
  )
}
