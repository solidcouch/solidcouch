import { Avatar } from '@/components'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { URI } from '@/types'
import { Link } from 'react-router-dom'
import styles from './PersonBadge.module.scss'

export const PersonBadge = ({
  webId,
  link,
}: {
  webId: URI
  link?: boolean
}) => {
  const { communityId } = useConfig()
  const [person] = useProfile(webId, communityId)

  const badge = (
    <div className={styles.container}>
      <Avatar photo={person.photo} size={1} />
      {person?.name}
    </div>
  )
  if (link)
    return <Link to={`/profile/${encodeURIComponent(webId)}`}>{badge}</Link>
  else return badge
}
