import { ButtonLink } from 'components'
import type { FoafProfile } from 'ldo/foafProfile.typings'
import { FaExternalLinkAlt, FaPencilAlt } from 'react-icons/fa'
import { useOutletContext } from 'react-router-dom'
import styles from './Profile.module.scss'

export const Profile = () => {
  const profile = useOutletContext<FoafProfile>()

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
      <ButtonLink secondary to="edit">
        <FaPencilAlt /> edit profile
      </ButtonLink>
    </div>
  )
}
