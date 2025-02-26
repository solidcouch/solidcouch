import { useReadInterest } from '@/hooks/data/useInterests'
import { URI } from '@/types'
import clsx from 'clsx'
import merge from 'lodash/merge'
import { ComponentProps } from 'react'
import { FaTimes } from 'react-icons/fa'
import styles from './Interests.module.scss'

/**
 * This component shows a tag with wikidata data.
 *
 * It accepts url of wikidata entity, and displays a tag with localized label.
 * @param {string} props.uri - uri of wikidata entity
 * @param {boolean} [props.highlighted] - whether the tag should be highlighted
 * @param {() => void} [props.onRemove] - callback when clicking (x) button, (x) button is closed when onRemove is defined
 * @param {string} props.locale - language code to use for label etc.
 * @param ...rest - all the other parameters acceptable by `span`
 */
export const Interest = ({
  uri,
  highlighted,
  onRemove,
  locale,
  className,
  ...rest
}: {
  uri: URI
  highlighted?: boolean
  onRemove?: () => void
  locale: string
} & ComponentProps<'span'>) => {
  const { data } = useReadInterest(uri, locale)

  const temporaryData = {
    id: uri,
    label: uri.split('/').pop(),
    description: uri,
  }

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
