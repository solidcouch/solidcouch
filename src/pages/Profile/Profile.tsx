import { FaPencilAlt } from 'react-icons/fa'
import { useParams } from 'react-router-dom'
import {
  ButtonLink,
  ExternalIconLink,
  Interests,
  Loading,
} from '../../components/index.ts'
import { ProtectedImg } from '../../components/ProtectedImg.tsx'
import { useConfig } from '../../config/hooks.ts'
import { useProfile } from '../../hooks/data/useProfile.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import { ManageContact } from './ManageContact.tsx'
import styles from './Profile.module.scss'

export const Profile = () => {
  const { communityId } = useConfig()
  const personId = useParams().id as string
  const auth = useAuth()
  const isMe = personId && auth.webId ? personId === auth.webId : undefined

  const [profile] = useProfile(personId, communityId)
  const [myProfile] = useProfile(auth.webId as string, communityId)

  return (
    <div className={styles.container}>
      <ProtectedImg
        className={styles.photo}
        src={profile.photo}
        alt={`Profile photo of ${profile.name}`}
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
          <FaPencilAlt /> edit profile
        </ButtonLink>
      )}
      {isMe === false && (
        <ButtonLink secondary to={`/messages/${encodeURIComponent(personId)}`}>
          Write a message
        </ButtonLink>
      )}
      <ButtonLink tertiary to="contacts">
        contacts
      </ButtonLink>
      {isMe === false && <ManageContact webId={personId} />}
      <section>
        {profile.interests ? (
          <Interests
            ids={profile.interests}
            highlighted={isMe ? [] : (myProfile.interests ?? [])}
          />
        ) : (
          <Loading>loading interests...</Loading>
        )}
      </section>
    </div>
  )
}
