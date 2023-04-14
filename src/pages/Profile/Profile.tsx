import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { ButtonLink, Interests, Loading } from 'components'
import { useAuth } from 'hooks/useAuth'
import type { FoafProfile } from 'ldo/foafProfile.typings'
import { FaExternalLinkAlt, FaPencilAlt } from 'react-icons/fa'
import { useOutletContext } from 'react-router-dom'
import { ManageContact } from './ManageContact'
import styles from './Profile.module.scss'

export const Profile = () => {
  const profile = useOutletContext<FoafProfile>()
  const auth = useAuth()

  const { data: interests } = comunicaApi.endpoints.readInterests.useQuery(
    profile['@id'] ? { person: profile['@id'] } : skipToken,
  )
  const { data: myInterests } = comunicaApi.endpoints.readInterests.useQuery(
    auth.webId ? { person: auth.webId } : skipToken,
  )

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
      {auth.webId && profile['@id'] && auth.webId !== profile['@id'] && (
        <ManageContact webId={profile['@id']} />
      )}
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
