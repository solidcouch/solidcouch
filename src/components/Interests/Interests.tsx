import { useReadInterest } from '@/hooks/data/useInterests'
import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'
import { URI } from '@/types'
import clsx from 'clsx'
import merge from 'lodash/merge'
import styles from './Interests.module.scss'

export const Interests = ({
  ids,
  highlighted,
}: {
  ids: URI[]
  highlighted?: URI[]
}) => {
  if (ids.length === 0) return null

  return (
    <ul className={styles.list} data-cy="interests-list">
      {ids.map(id => (
        <li key={id}>
          <Interest
            id={id}
            highlighted={highlighted && highlighted.includes(id)}
          />
        </li>
      ))}
    </ul>
  )
}

const Interest = ({ id, highlighted }: { id: URI; highlighted?: boolean }) => {
  const locale = useAppSelector(selectLocale)
  const { data } = useReadInterest(id, locale)

  const temporaryData = {
    id,
    label: id.split('/').pop(),
    description: id,
  }

  const thing = merge({}, temporaryData, data)

  return (
    <span
      className={clsx(styles.item, highlighted && styles.highlighted)}
      title={thing.description}
    >
      {thing.label}
    </span>
  )
}
