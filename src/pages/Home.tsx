import { ButtonLink } from '@/components'
import { IconLoading } from '@/components/IconLoading'
import { useReadMessagesFromInbox } from '@/hooks/data/useReadThreads'
import { useAuth } from '@/hooks/useAuth'
import { Plural, Trans } from '@lingui/react/macro'
import { FaDoorOpen, FaMap, FaRegComment } from 'react-icons/fa'
import styles from './Home.module.scss'

export const Home = () => {
  const auth = useAuth()

  const { data: newMessages, isLoading } = useReadMessagesFromInbox(auth.webId!)

  const messageCount = newMessages.length

  return (
    <div className={styles.container}>
      <ButtonLink to="travel" secondary>
        <FaMap size={24} /> <Trans>travel</Trans>
      </ButtonLink>
      <ButtonLink to="host" secondary>
        <FaDoorOpen size={24} /> <Trans>host</Trans>
      </ButtonLink>
      <ButtonLink to="messages" secondary>
        <FaRegComment size={24} /> <Trans>messages</Trans>
        {isLoading ? (
          <IconLoading data-testid="message-count-loading" />
        ) : messageCount ? (
          <>
            {' '}
            <Plural value={messageCount} one="(# new)" other="(# new)" />
          </>
        ) : null}
      </ButtonLink>
    </div>
  )
}
