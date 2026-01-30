import { Loading } from '@/components'
import { ContactStatus, useReadContacts } from '@/hooks/data/useContacts'
import { useAuth } from '@/hooks/useAuth'
import { URI } from '@/types'
import { Trans } from '@lingui/react/macro'
import { AddContact } from './AddContact'
import { ProcessContactRequest } from './ProcessContactRequest'

export const ManageContact = ({ webId }: { webId: URI }) => {
  const auth = useAuth()
  const [contacts] = useReadContacts(auth.webId!)

  if (!contacts)
    return (
      <Loading>
        <Trans>Loading...</Trans>
      </Loading>
    )

  const contact = contacts.find(c => c.webId === webId)

  if (!contact) return <AddContact webId={webId} />

  if (contact.status === ContactStatus.confirmed)
    return <Trans>Contact exists</Trans>

  if (contact.status === ContactStatus.requestSent)
    return <Trans>Contact request sent</Trans>
  if (contact.status === ContactStatus.requestReceived)
    return <ProcessContactRequest contact={contact} />

  return null
}
