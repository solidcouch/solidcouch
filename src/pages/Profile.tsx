import { ButtonLink } from 'components'
import { useAuth } from 'hooks/useAuth'
import type { FoafProfile } from 'ldo/foafProfile.typings'
import { FaExternalLinkAlt, FaPencilAlt } from 'react-icons/fa'
import { useOutletContext } from 'react-router-dom'
import styles from './Profile.module.scss'

export const Profile = () => {
  const profile = useOutletContext<FoafProfile>()
  const auth = useAuth()

  return (
    <div className={styles.container}>
      <img
        className={styles.photo}
        src={profile.hasPhoto?.['@id'] ?? profile.img}
        alt=""
      />
      <header className={styles.name}>
        {profile.name}{' '}
        <a href={profile['@id']} target="_blank" rel="noopener noreferrer">
          <FaExternalLinkAlt />
        </a>
      </header>
      {profile['@id'] === auth.webId && (
        <ButtonLink secondary to="/profile/edit">
          <FaPencilAlt /> edit profile
        </ButtonLink>
      )}
      <ButtonLink tertiary to="contacts">
        contacts
      </ButtonLink>
    </div>
  )
}
