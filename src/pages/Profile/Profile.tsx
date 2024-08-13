import { ButtonLink, ExternalIconLink, Interests, Loading } from 'components'
import { ProtectedImg } from 'components/ProtectedImg'
import { useConfig } from 'config/hooks'
import { useProfile } from 'hooks/data/useProfile'
import { useAuth } from 'hooks/useAuth'
import { FaPencilAlt } from 'react-icons/fa'
import { useParams } from 'react-router-dom'
import { ManageContact } from './ManageContact'
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
      <ProtectedImg className={styles.photo} src={profile.photo} alt="" />
      <header className={styles.name}>
        {profile.name} <ExternalIconLink href={personId} />
      </header>
      <section className={styles.about}>{profile.about}</section>
      {isMe && (
        <ButtonLink secondary to="/profile/edit">
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
            highlighted={isMe ? [] : myProfile.interests ?? []}
          />
        ) : (
          <Loading>loading interests...</Loading>
        )}
      </section>
    </div>
  )
}
