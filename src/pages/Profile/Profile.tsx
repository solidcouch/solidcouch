import { ButtonLink, Interests, Loading } from 'components'
import { ProtectedImg } from 'components/ProtectedImg'
import { communityId } from 'config'
import { useProfile2 } from 'hooks/data/useProfile'
import { useAuth } from 'hooks/useAuth'
import { FaExternalLinkAlt, FaPencilAlt } from 'react-icons/fa'
import { useParams } from 'react-router-dom'
import { ManageContact } from './ManageContact'
import styles from './Profile.module.scss'

export const Profile = () => {
  const personId = useParams().id as string
  const auth = useAuth()
  const [profile] = useProfile2(personId, communityId)

  const isMe = personId && auth.webId ? personId === auth.webId : undefined

  const [myProfile] = useProfile2(auth.webId as string, communityId)

  return (
    <div className={styles.container}>
      <ProtectedImg className={styles.photo} src={profile.photo} alt="" />
      <header className={styles.name}>
        {profile.name}{' '}
        <a href={personId} target="_blank" rel="noopener noreferrer">
          <FaExternalLinkAlt />
        </a>
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
            highlighted={myProfile.interests ?? []}
          />
        ) : (
          <Loading>loading interests...</Loading>
        )}
      </section>
    </div>
  )
}
