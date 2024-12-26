import { ButtonLink } from '@/components'
import { useReadMessagesFromInbox } from '@/hooks/data/useReadThreads'
import { useAuth } from '@/hooks/useAuth'
import { FaDoorOpen, FaMap, FaRegComment } from 'react-icons/fa'
import styles from './Home.module.scss'

export const Home = () => {
  const auth = useAuth()

  const { data: newMessages } = useReadMessagesFromInbox(auth.webId!)

  return (
    <div className={styles.container}>
      <ButtonLink to="travel" secondary>
        <FaMap size={24} /> travel
      </ButtonLink>
      <ButtonLink to="host" secondary>
        <FaDoorOpen size={24} /> host
      </ButtonLink>
      <ButtonLink to="messages" secondary>
        <FaRegComment size={24} /> messages
        {newMessages?.length ? ` (${newMessages.length} new)` : null}
      </ButtonLink>
    </div>
  )
}
