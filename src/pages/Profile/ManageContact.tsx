import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { Button, Loading } from 'components'
import { useAuth } from 'hooks/useAuth'
import { ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from 'react-modal'
import { ContactInvitation, URI } from 'types'

export const ManageContact = ({ webId }: { webId: URI }) => {
  const auth = useAuth()
  const { data: contacts } = comunicaApi.endpoints.readContacts.useQuery(
    auth.webId ?? skipToken,
  )

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
  const [modalOpen, setModalOpen] = useState(false)
  const auth = useAuth()

  const [confirmContact] = comunicaApi.endpoints.confirmContact.useMutation()
  const [ignoreContact] = comunicaApi.endpoints.ignoreContact.useMutation()

  const handleConfirm = async () => {
    if (!auth.webId) throw new Error('unauthenticated')
    await confirmContact({
      me: auth.webId,
      other: contact.webId,
      notification: contact.notification,
    })
    setModalOpen(false)
  }
  const handleIgnore = async () => {
    if (!auth.webId) throw new Error('unauthenticated')
    await ignoreContact({
      me: auth.webId,
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
        <Button primary onClick={handleConfirm}>
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
  const [modalOpen, setModalOpen] = useState(false)
  const auth = useAuth()

  const [createContact] = comunicaApi.endpoints.createContact.useMutation()

  const handleSubmit = async ({ invitation }: { invitation: string }) => {
    if (!auth.webId) throw new Error('unauthenticated')
    await createContact({ me: auth.webId, other: webId, invitation }).unwrap()
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
