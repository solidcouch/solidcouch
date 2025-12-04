import { Avatar } from '@/components'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { useLocale } from '@/hooks/useLocale'
import { URI } from '@/types'
import styles from './Message.module.scss'

export const Message = ({
  message,
  created,
  webid,
  showBadge,
}: {
  message: string
  created: Date
  webid: URI
  showBadge?: boolean
}) => {
  const locale = useLocale()
  const time = created.toLocaleTimeString(locale, {
    // eslint-disable-next-line lingui/no-unlocalized-strings
    hour: 'numeric',
    // eslint-disable-next-line lingui/no-unlocalized-strings
    minute: 'numeric',
  })
  const datetime = created.toLocaleString(locale)
  const { communityId } = useConfig()
  const [person] = useProfile(webid, communityId)
  return (
    <>
      {showBadge && (
        <div className={styles.author}>
          <Avatar photo={person.photo} name={person.name} />
          <div className={styles.name}>{person.name}</div>
        </div>
      )}
      <div className={styles.message}>
        <div title={datetime} className={styles.time}>
          {time}
        </div>
        <p className={styles.content}>{message}</p>
      </div>
    </>
  )
}
