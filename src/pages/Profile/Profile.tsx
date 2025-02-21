import { ButtonLink, ExternalIconLink, Interests, Loading } from '@/components'
import { ProtectedImg } from '@/components/ProtectedImg.tsx'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { Trans, useLingui } from '@lingui/react/macro'
import { FaPencilAlt } from 'react-icons/fa'
import { useParams } from 'react-router-dom'
import { ManageContact } from './ManageContact.tsx'
import styles from './Profile.module.scss'

export const Profile = () => {
  const { t } = useLingui()
  const { communityId } = useConfig()
  const personId = useParams().id as string
  const auth = useAuth()
  const isMe = personId && auth.webId ? personId === auth.webId : undefined

  const [profile] = useProfile(personId, communityId)
  const [myProfile] = useProfile(auth.webId as string, communityId)

  const name = profile.name

  return (
    <div className={styles.container}>
      <ProtectedImg
        className={styles.photo}
        src={profile.photo}
        alt={t`Profile photo of ${name}`}
        data-cy="profile-photo"
      />
      <header className={styles.name} data-cy="profile-name">
        {profile.name} <ExternalIconLink href={personId} />
      </header>
      <section className={styles.about} data-cy="profile-about">
        {profile.about}
      </section>
      {isMe && (
        <ButtonLink secondary to="/profile/edit" data-cy="edit-profile-link">
          <FaPencilAlt /> <Trans>edit profile</Trans>
        </ButtonLink>
      )}
      {isMe === false && (
        <ButtonLink secondary to={`/messages/${encodeURIComponent(personId)}`}>
          <Trans>Write a message</Trans>
        </ButtonLink>
      )}
      <ButtonLink tertiary to="contacts">
        <Trans>contacts</Trans>
      </ButtonLink>
      {isMe === false && <ManageContact webId={personId} />}
      <section>
        {profile.interests ? (
          <Interests
            ids={profile.interests}
            highlighted={isMe ? [] : (myProfile.interests ?? [])}
          />
        ) : (
          <Loading>
            <Trans>loading interests...</Trans>
          </Loading>
        )}
      </section>
    </div>
  )
}
