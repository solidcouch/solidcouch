import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'
import { URI } from '@/types'
import { Interest } from './Interest'
import styles from './Interests.module.scss'

export const Interests = ({
  ids,
  highlighted,
}: {
  ids: URI[]
  highlighted?: URI[]
}) => {
  const locale = useAppSelector(selectLocale)

  if (ids.length === 0) return null

  return (
    <ul className={styles.list} data-cy="interests-list">
      {ids.map(id => (
        <li key={id}>
          <Interest
            uri={id}
            highlighted={highlighted && highlighted.includes(id)}
            locale={locale}
          />
        </li>
      ))}
    </ul>
  )
}

export const SharedInterests = ({ ids }: { ids: URI[] }) => {
  const { communityId } = useConfig()
  const auth = useAuth()
  const [myProfile] = useProfile(auth.webId!, communityId)

  return <Interests ids={ids} highlighted={myProfile.interests} />
}
