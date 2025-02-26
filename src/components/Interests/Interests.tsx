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
