import { Button, Loading } from '@/components'
import { Modal } from '@/components/Modal/Modal'
import { useConfig } from '@/config/hooks'
import { useCheckSetup } from '@/hooks/data/useCheckSetup'
import {
  ContactStatus,
  useConfirmContact,
  useCreateContact,
  useIgnoreContactRequest,
  useReadContacts,
} from '@/hooks/data/useContacts'
import { useAuth } from '@/hooks/useAuth'
import { ContactInvitation, URI } from '@/types'
import { getContainer } from '@/utils/helpers'
import { Trans, useLingui } from '@lingui/react/macro'
import { ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'

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
  const { t } = useLingui()
  const { communityId } = useConfig()
  const [modalOpen, setModalOpen] = useState(false)
  const auth = useAuth()

  const confirmContact = useConfirmContact()
  const ignoreContact = useIgnoreContactRequest()

  const setup = useCheckSetup(auth.webId!, communityId)

  const handleConfirm = async () => {
    const hospexContainer = getContainer(setup.personalHospexDocuments[0])
    if (!hospexContainer)
      throw new Error(t`hospex container not found (too soon?)`)
    await confirmContact({
      me: auth.webId!,
      other: contact.webId,
      notification: contact.notification,
      hospexContainer,
    })
    setModalOpen(false)
  }
  const handleIgnore = async () => {
    // if (!auth.webId) throw new Error(`unauthenticated`)
    await ignoreContact({
      notification: contact.notification,
    })
    setModalOpen(false)
  }

  return (
    <>
      <Button primary onClick={() => setModalOpen(true)}>
        {children ?? <Trans>See contact invitation</Trans>}
      </Button>
      <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <div>{contact.invitation}</div>
        <Button
          primary
          onClick={handleConfirm}
          disabled={setup.personalHospexDocuments.length === 0}
        >
          <Trans>Accept</Trans>
        </Button>
        <Button secondary onClick={handleIgnore}>
          <Trans>Ignore</Trans>
        </Button>
      </Modal>
    </>
  )
}

const AddContact = ({ webId }: { webId: URI }) => {
  const { t } = useLingui()
  const { communityId } = useConfig()
  const [modalOpen, setModalOpen] = useState(false)
  const auth = useAuth()

  const createContact2 = useCreateContact()
  const mySetup = useCheckSetup(auth.webId!, communityId)
  const otherSetup = useCheckSetup(webId, communityId)

  const handleSubmit = async ({ invitation }: { invitation: string }) => {
    const hospexContainer = getContainer(mySetup.personalHospexDocuments[0])
    if (!hospexContainer)
      throw new Error(t`hospex container not found (too soon?)`)
    const inbox = getContainer(otherSetup.inboxes[0])
    if (!inbox) throw new Error(t`inbox not found (too soon?)`)

    await createContact2({
      me: auth.webId!,
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
        <Trans>Add to my contacts</Trans>
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
  const { t } = useLingui()
  const { register, handleSubmit } = useForm<{ invitation: string }>({
    defaultValues: { invitation: t`Hi! I'd like to add you as a contact!` },
  })

  const handleFormSubmit = handleSubmit(async data => {
    await onSubmit(data)
  })

  return (
    <div>
      <h1>
        <Trans>Add person as a contact</Trans>
      </h1>
      <div>
        <Trans>Please invite only people you know personally.</Trans>
      </div>
      <form onSubmit={handleFormSubmit} onReset={onCancel}>
        <textarea {...register('invitation')} />
        <Button primary type="submit">
          <Trans>Send contact invitation</Trans>
        </Button>
        <Button secondary type="reset">
          <Trans>Cancel</Trans>
        </Button>
      </form>
    </div>
  )
}
