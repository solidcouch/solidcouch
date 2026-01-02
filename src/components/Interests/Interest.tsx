import { useReadInterest } from '@/hooks/data/useInterests'
import { type Interest as InterestData, URI } from '@/types'
import { useLingui } from '@lingui/react/macro'
import clsx from 'clsx'
import merge from 'lodash/merge'
import { Popover } from 'radix-ui'
import { ComponentProps } from 'react'
import { FaLink, FaTimes } from 'react-icons/fa'
import { SiWikidata } from 'react-icons/si'
import { ExternalIconLink } from '../Button/Button'
import styles from './Interest.module.scss'

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
  const { t } = useLingui()

  const { data } = useReadInterest(uri, locale)

  const temporaryData = {
    uri,
    label: uri.split('/').pop(),
    description: '',
    aliases: [],
  }

  const thing: InterestData = merge({}, temporaryData, data)

  return (
    <Popover.Root>
      <span
        {...rest}
        className={clsx(
          styles.item,
          highlighted && styles.highlighted,
          className,
        )}
      >
        <Popover.Trigger asChild>
          <button className={styles.trigger} title={thing.description}>
            {thing.label}{' '}
          </button>
        </Popover.Trigger>
        {onRemove && (
          <button className={styles.remove} onClick={onRemove}>
            <FaTimes />
          </button>
        )}
      </span>
      <Popover.Portal>
        <Popover.Content sideOffset={5} className={styles.popover}>
          <Popover.Close className={styles.close} aria-label={t`Close`}>
            <FaTimes />
          </Popover.Close>
          <InterestDetail topic={thing} />
          <Popover.Arrow className={styles.arrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const InterestDetail = ({ topic }: { topic: InterestData }) => (
  <div className={styles.detail}>
    {/* TODO populate the alt */}
    {topic.image && <img src={topic.image} alt="" className={styles.image} />}
    <header className={styles.headerContainer}>
      <h2 className={styles.header}>
        {topic.label}
        <ExternalIconLink
          href={topic.uri}
          icon={topic.id ? SiWikidata : undefined}
        />
      </h2>
      {topic.aliases.length > 0 && (
        <div className={styles.aliases}>{topic.aliases.join(', ')}</div>
      )}
      {topic.officialWebsite && (
        <a
          href={topic.officialWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.website}
        >
          <FaLink />
          {topic.officialWebsite}
        </a>
      )}
    </header>
    <section>{topic.description}</section>
  </div>
)
