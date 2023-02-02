import { ButtonLink } from 'components'
import { NavLayout } from 'layouts/NavLayout'
import { FaRegComment } from 'react-icons/fa'
import styles from './Home.module.scss'

const tabs = [{ link: 'messages', label: <FaRegComment size={32} /> }]

export const Home = () => {
  return (
    <NavLayout tabs={tabs}>
      <div className={styles.container}>
        <ButtonLink to="travel" secondary>
          travel
        </ButtonLink>
        <ButtonLink to="host" secondary>
          host
        </ButtonLink>
      </div>
    </NavLayout>
  )
}
