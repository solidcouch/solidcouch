import { ldoApi } from 'app/services/ldoApi'
import { Avatar } from 'components/Avatar/Avatar'
import { Link } from 'react-router-dom'
import { URI } from 'types'
import styles from './PersonBadge.module.scss'

export const PersonBadge = ({
  webId,
  link,
}: {
  webId: URI
  link?: boolean
}) => {
  const { data: person } = ldoApi.endpoints.readUser.useQuery(webId)

  const badge = (
    <div className={styles.container}>
      <Avatar photo={person?.hasPhoto?.['@id'] ?? person?.img} size={1} />
      {person?.name}
    </div>
  )
  if (link)
    return <Link to={`/profile/${encodeURIComponent(webId)}`}>{badge}</Link>
  else return badge
}
