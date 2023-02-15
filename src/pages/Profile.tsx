import { ButtonLink } from 'components'
import type { FoafProfile } from 'ldo/foafProfile.typings'
import { FaExternalLinkAlt, FaPencilAlt } from 'react-icons/fa'
import { useOutletContext } from 'react-router-dom'

export const Profile = () => {
  const profile = useOutletContext<FoafProfile>()

  return (
    <div>
      <header>
        {profile.name}{' '}
        <ButtonLink secondary to="edit">
          <FaPencilAlt /> Edit
        </ButtonLink>
        <a href={profile['@id']} target="_blank" rel="noopener noreferrer">
          <FaExternalLinkAlt />
        </a>
      </header>
      <img src={profile.hasPhoto?.['@id'] ?? profile.img} alt="" />
    </div>
  )
}
