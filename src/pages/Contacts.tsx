import { comunicaApi } from 'app/services/comunicaApi'
import { Loading } from 'components'
import { PersonBadge } from 'components/PersonBadge/PersonBadge'
import { useAuth } from 'hooks/useAuth'
import { useParams } from 'react-router-dom'
import * as types from 'types'
import styles from './Contacts.module.scss'
import { ProcessContactInvitation } from './Profile/ManageContact'

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
        Contacts of <PersonBadge webId={personId} link />
      </h1>
      <ul className={styles.contactList}>
        {contacts
          .filter(
            contact =>
              personId === auth.webId || contact.status === 'confirmed',
          )
          .map(contact => (
            <li
              key={
                'notification' in contact ? contact.notification : contact.webId
              }
            >
              <Contact contact={contact} />
            </li>
          ))}
      </ul>
    </div>
  )
}

const Contact = ({ contact }: { contact: types.Contact }) => {
  return (
    <div className={styles.contact}>
      <PersonBadge webId={contact.webId} link />
      <span className={styles.spacer}></span>
      {contact.status === 'request_sent' && (
        <span className={styles.status}>pending</span>
      )}
      {contact.status === 'request_received' && (
        <>
          <ProcessContactInvitation contact={contact}>
            process
          </ProcessContactInvitation>
          <span className={styles.status}>pending</span>
        </>
      )}
    </div>
  )
}
