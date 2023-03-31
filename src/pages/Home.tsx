import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { ButtonLink } from 'components'
import { useAuth } from 'hooks/useAuth'
import { NavLayout } from 'layouts/NavLayout'
import { useMemo } from 'react'
import { FaRegComment } from 'react-icons/fa'
import styles from './Home.module.scss'

export const Home = () => {
  const auth = useAuth()

  const { data: newMessages } =
    comunicaApi.endpoints.readMessagesFromInbox.useQuery(
      auth.webId ? { me: auth.webId } : skipToken,
    )

  const tabs = useMemo(
    () => [
      {
        link: 'messages',
        label: (
          <span>
            <FaRegComment size={32} />
            {newMessages?.length ? ` (${newMessages.length} new)` : null}
          </span>
        ),
      },
    ],
    [newMessages],
  )

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
