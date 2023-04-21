import { ldoApi } from 'app/services/ldoApi'
import { Avatar } from 'components/Avatar/Avatar'
import { URI } from 'types'
import styles from './PersonBadge.module.scss'

export const PersonBadge = ({ webId }: { webId: URI }) => {
  const { data: person } = ldoApi.endpoints.readUser.useQuery(webId)

  return (
    <div className={styles.container}>
      <Avatar photo={person?.hasPhoto?.['@id'] ?? person?.img} size={1} />
      {person?.name}
    </div>
  )
}
