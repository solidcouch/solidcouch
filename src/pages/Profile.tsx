import type { FoafProfile } from 'ldo/foafProfile.typings'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { useLoaderData } from 'react-router-dom'

export const Profile = () => {
  const data = useLoaderData() as FoafProfile
  return (
    <div>
      <header>
        {data.name}{' '}
        <a href={data['@id']} target="_blank" rel="noopener noreferrer">
          <FaExternalLinkAlt />
        </a>
      </header>
      <img src={data.img ?? data.hasPhoto?.['@id']} alt="" />
    </div>
  )
}
