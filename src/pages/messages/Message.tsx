import { useLocale } from '@/hooks/useLocale'
import styles from './Message.module.scss'

export const Message = ({
  message,
  created,
}: {
  message: string
  created: Date
}) => {
  const locale = useLocale()
  const time = created.toLocaleTimeString(locale, {
    // eslint-disable-next-line lingui/no-unlocalized-strings
    hour: 'numeric',
    // eslint-disable-next-line lingui/no-unlocalized-strings
    minute: 'numeric',
  })
  const datetime = created.toLocaleString(locale)
  return (
    <div className={styles.message}>
      <div title={datetime}>{time}</div>
      <p>{message}</p>
    </div>
  )
}
