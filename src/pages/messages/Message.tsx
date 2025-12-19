import { Person } from '@/components/Person/Person'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { useLocale } from '@/hooks/useLocale'
import { URI } from '@/types'
import clsx from 'clsx'
import styles from './Message.module.scss'

export const Message = ({
  message,
  created,
  webid,
  showBadge,
  isUnread,
}: {
  message: string
  created: Date
  webid: URI
  showBadge?: boolean
  isUnread?: boolean
}) => {
  const locale = useLocale()
  const time = created.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: 'numeric',
  })
  const datetime = created.toLocaleString(locale)
  const { communityId } = useConfig()
  const [person] = useProfile(webid, communityId)
  return (
    <>
      {showBadge && (
        <div className={styles.author}>
          <div>
            <Person webId={webid} size="2rem" popover />
          </div>
          <div className={styles.name}>{person.name}</div>
        </div>
      )}
      <div className={clsx(styles.message, isUnread && styles.unread)}>
        <div title={datetime} className={styles.time}>
          {time}
        </div>
        <p className={styles.content}>{message}</p>
      </div>
    </>
  )
}
