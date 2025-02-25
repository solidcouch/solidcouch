import { useReadInterest } from '@/hooks/data/useInterests'
import { URI } from '@/types'
import clsx from 'clsx'
import merge from 'lodash/merge'
import { ComponentProps } from 'react'
import { FaTimes } from 'react-icons/fa'
import styles from './Interests.module.scss'

export const Interest = ({
  id,
  highlighted,
  onRemove,
  locale,
  className,
  ...rest
}: {
  id: URI
  highlighted?: boolean
  onRemove?: () => void
  locale?: string
} & ComponentProps<'span'>) => {
  const { data } = useReadInterest(id, locale)

  const temporaryData = { id, label: id.split('/').pop(), description: id }

  const thing = merge({}, temporaryData, data)

  return (
    <span
      {...rest}
      className={clsx(
        styles.item,
        highlighted && styles.highlighted,
        className,
      )}
      title={thing.description}
    >
      {thing.label}{' '}
      {onRemove && (
        <button onClick={onRemove}>
          <FaTimes />
        </button>
      )}
    </span>
  )
}
