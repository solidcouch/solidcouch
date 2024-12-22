import { FaDoorOpen, FaMap, FaRegComment } from 'react-icons/fa'
import { ButtonLink } from '../components/index.ts'
import { useReadMessagesFromInbox } from '../hooks/data/useReadThreads.ts'
import { useAuth } from '../hooks/useAuth.ts'
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
