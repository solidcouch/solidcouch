import classNames from 'classnames'
import { useReadInterest } from 'hooks/data/useInterests'
import { merge } from 'lodash'
import { URI } from 'types'
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
    <ul className={styles.list}>
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
  const { data } = useReadInterest(id)

  const temporaryData = {
    id,
    label: id.split('/').pop(),
    description: id,
  }

  const thing = merge({}, temporaryData, data)

  return (
    <span
      className={classNames(styles.item, highlighted && styles.highlighted)}
      title={thing.description}
    >
      {thing.label}
    </span>
  )
}
