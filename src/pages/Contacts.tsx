import { comunicaApi } from 'app/services/comunicaApi'
import { Button, Loading } from 'components'
import { PersonBadge } from 'components/PersonBadge/PersonBadge'
import { useAuth } from 'hooks/useAuth'
import { Link, useParams } from 'react-router-dom'
import * as types from 'types'
import styles from './Contacts.module.scss'

export const Contacts = () => {
  const personId = useParams().id as string
  const auth = useAuth()

  const { data: contacts } =
    comunicaApi.endpoints.readContacts.useQuery(personId)

  if (!auth.webId) return <Loading>authenticating</Loading>
  if (!contacts) return <Loading>fetching contacts</Loading>

  return (
    <div>
      <h1>
        Contacts of <PersonBadge webId={personId} />
      </h1>
      <ul className={styles.contactList}>
        {contacts
          .filter(
            contact =>
              personId === auth.webId || contact.status === 'confirmed',
          )
          .map(contact => (
            <li key={contact.webId}>
              <Contact contact={contact} />
            </li>
          ))}
      </ul>
    </div>
  )
}

/**
 *
 * @param contact - the con
 * @returns
 */
const Contact = ({ contact }: { contact: types.Contact }) => {
  return (
    <div className={styles.contact}>
      <Link to={`/profile/${encodeURIComponent(contact.webId)}`}>
        <PersonBadge webId={contact.webId} />
      </Link>
      <span className={styles.spacer}></span>
      {contact.status === 'request_sent' && (
        <span className={styles.status}>pending</span>
      )}
      {contact.status === 'request_received' && (
        <>
          <span className={styles.status}>pending</span>
          <Button primary>Accept</Button>
          <Button secondary>Ignore</Button>
        </>
      )}
    </div>
  )
}
