import { ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from 'react-modal'
import { ContactInvitation, URI } from 'types'
import { Button, Loading } from '../../components'
import { useConfig } from '../../config/hooks'
import { useCheckSetup } from '../../hooks/data/useCheckSetup'
import {
  useConfirmContact,
  useCreateContact,
  useIgnoreContactRequest,
  useReadContacts,
} from '../../hooks/data/useContacts'
import { useAuth } from '../../hooks/useAuth'
import { getContainer } from '../../utils/helpers'

export const ManageContact = ({ webId }: { webId: URI }) => {
  const auth = useAuth()
  const [contacts] = useReadContacts(auth.webId!)

  if (!contacts) return <Loading>loading...</Loading>

  const contact = contacts.find(c => c.webId === webId)

  if (!contact) return <AddContact webId={webId} />

  if (contact.status === 'confirmed') return <>Contact exists</>

  if (contact.status === 'request_sent') return <>Contact request sent</>
  if (contact.status === 'request_received')
    return <ProcessContactInvitation contact={contact} />

  return null
}

export const ProcessContactInvitation = ({
  contact,
  children,
}: {
  contact: ContactInvitation
  children?: ReactNode
}) => {
  const { communityId } = useConfig()
  const [modalOpen, setModalOpen] = useState(false)
  const auth = useAuth()

  const confirmContact = useConfirmContact()
  const ignoreContact = useIgnoreContactRequest()

  const setup = useCheckSetup(auth.webId!, communityId)

  const handleConfirm = async () => {
    if (!auth.webId) throw new Error('unauthenticated')
    const hospexContainer = getContainer(setup.personalHospexDocuments[0])
    if (!hospexContainer)
      throw new Error('hospex container not set up (too soon?)')
    await confirmContact({
      me: auth.webId,
      other: contact.webId,
      notification: contact.notification,
      hospexContainer,
    })
    setModalOpen(false)
  }
  const handleIgnore = async () => {
    if (!auth.webId) throw new Error('unauthenticated')
    await ignoreContact({
      notification: contact.notification,
    })
    setModalOpen(false)
  }

  return (
    <>
      <Button primary onClick={() => setModalOpen(true)}>
        {children ?? 'See contact invitation'}
      </Button>
      <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <div>{contact.invitation}</div>
        <Button
          primary
          onClick={handleConfirm}
          disabled={setup.personalHospexDocuments.length === 0}
        >
          Accept
        </Button>
        <Button secondary onClick={handleIgnore}>
          Ignore
        </Button>
      </Modal>
    </>
  )
}

const AddContact = ({ webId }: { webId: URI }) => {
  const { communityId } = useConfig()
  const [modalOpen, setModalOpen] = useState(false)
  const auth = useAuth()

  const createContact2 = useCreateContact()
  const mySetup = useCheckSetup(auth.webId!, communityId)
  const otherSetup = useCheckSetup(webId, communityId)

  const handleSubmit = async ({ invitation }: { invitation: string }) => {
    if (!auth.webId) throw new Error('unauthenticated')
    const hospexContainer = getContainer(mySetup.personalHospexDocuments[0])
    if (!hospexContainer)
      throw new Error('hospex container not found (too soon?)')
    const inbox = getContainer(otherSetup.inboxes[0])
    if (!inbox) throw new Error('inbox not found (too soon?)')

    await createContact2({
      me: auth.webId,
      other: webId,
      message: invitation,
      hospexContainer,
      inbox,
    })
    setModalOpen(false)
  }
  const handleCancel = async () => {
    setModalOpen(false)
  }

  return (
    <>
      <Button
        secondary
        onClick={() => {
          setModalOpen(true)
        }}
        disabled={
          mySetup.personalHospexDocuments.length === 0 ||
          otherSetup.inboxes.length === 0
        }
      >
        Add to my contacts
      </Button>
      <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <AddContactForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </Modal>
    </>
  )
}

const AddContactForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { invitation: string }) => Promise<void>
  onCancel: () => Promise<void>
}) => {
  const { register, handleSubmit } = useForm<{ invitation: string }>({
    defaultValues: { invitation: "Hi! I'd like to add you as a contact!" },
  })

  const handleFormSubmit = handleSubmit(async data => {
    await onSubmit(data)
  })

  return (
    <div>
      <h1>Add person as a contact</h1>
      <div>Please invite only people you know personally.</div>
      <form onSubmit={handleFormSubmit} onReset={onCancel}>
        <textarea {...register('invitation')} />
        <Button primary type="submit">
          Send contact invitation
        </Button>
        <Button secondary type="reset">
          Cancel
        </Button>
      </form>
    </div>
  )
}
