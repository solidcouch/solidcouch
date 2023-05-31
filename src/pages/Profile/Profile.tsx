import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { ButtonLink, Interests, Loading } from 'components'
import { ProtectedImg } from 'components/ProtectedImg'
import { useProfile } from 'hooks/data/useProfile'
import { useAuth } from 'hooks/useAuth'
import { FaExternalLinkAlt, FaPencilAlt } from 'react-icons/fa'
import { useParams } from 'react-router-dom'
import { ManageContact } from './ManageContact'
import styles from './Profile.module.scss'

export const Profile = () => {
  const personId = useParams().id as string
  const auth = useAuth()
  const profile = useProfile(personId)

  const isMe = personId && auth.webId ? personId === auth.webId : undefined

  const { data: interests } = comunicaApi.endpoints.readInterests.useQuery({
    person: personId,
  })
  const { data: myInterests } = comunicaApi.endpoints.readInterests.useQuery(
    auth.webId ? { person: auth.webId } : skipToken,
  )

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
        {interests ? (
          <Interests ids={interests} highlighted={myInterests ?? []} />
        ) : (
          <Loading>loading interests...</Loading>
        )}
      </section>
    </div>
  )
}
