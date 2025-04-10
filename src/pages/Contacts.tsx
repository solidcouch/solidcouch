import { Loading } from '@/components'
import { PersonBadge } from '@/components/PersonBadge/PersonBadge.tsx'
import { ContactStatus, useReadContacts } from '@/hooks/data/useContacts'
import { useAuth } from '@/hooks/useAuth'
import * as types from '@/types'
import { Trans } from '@lingui/react/macro'
import { useParams } from 'react-router-dom'
import styles from './Contacts.module.scss'
import { ProcessContactInvitation } from './Profile/ManageContact.tsx'

export const Contacts = () => {
  const personId = useParams().id as string
  const auth = useAuth()

  const [contacts] = useReadContacts(personId)

  if (!auth.webId)
    return (
      <Loading>
        <Trans>authenticating</Trans>
      </Loading>
    )
  if (!contacts)
    return (
      <Loading>
        <Trans>fetching contacts</Trans>
      </Loading>
    )

  return (
    <div>
      <h1>
        <Trans>
          Contacts of <PersonBadge webId={personId} link />
        </Trans>
      </h1>
      <ul className={styles.contactList} data-cy="contact-list">
        {contacts
          .filter(
            contact =>
              personId === auth.webId ||
              contact.status === ContactStatus.confirmed,
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
    <div className={styles.contact} data-cy="contact">
      <PersonBadge webId={contact.webId} link />
      <span className={styles.spacer}></span>
      {contact.status === ContactStatus.requestSent && (
        <span className={styles.status}>
          <Trans>pending</Trans>
        </span>
      )}
      {contact.status === ContactStatus.requestReceived && (
        <>
          <ProcessContactInvitation contact={contact}>
            <Trans>process</Trans>
          </ProcessContactInvitation>
          <span className={styles.status}>
            <Trans>pending</Trans>
          </span>
        </>
      )}
    </div>
  )
}
