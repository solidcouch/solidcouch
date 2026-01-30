import { Button } from '@/components'
import { Modal } from '@/components/Modal/Modal'
import { withToast } from '@/components/withToast'
import { useConfig } from '@/config/hooks'
import { useHospexDocument, useInbox } from '@/hooks/data/useCheckSetup'
import { useCreateContact } from '@/hooks/data/useContacts'
import { useAuth } from '@/hooks/useAuth'
import { URI } from '@/types'
import { getContainer } from '@/utils/helpers'
import { Trans, useLingui } from '@lingui/react/macro'
import { useState } from 'react'
import { AddContactForm } from './AddContactForm'

export const AddContact = ({ webId }: { webId: URI }) => {
  const { t } = useLingui()
  const { communityId } = useConfig()
  const [modalOpen, setModalOpen] = useState(false)
  const auth = useAuth()

  const createContact = useCreateContact()
  const { forCommunity: myHospexDocuments } = useHospexDocument(
    auth.webId!,
    communityId,
  )
  const { inbox: otherPersonInbox } = useInbox(webId)

  const handleSubmit = async ({ invitation }: { invitation: string }) => {
    const hospexContainer = getContainer(
      myHospexDocuments.values().next().value!.value,
    )

    await withToast(
      Promise.resolve().then(async () => {
        if (!hospexContainer)
          throw new Error(t`hospex container not found (too soon?)`)
        const inbox = getContainer(
          otherPersonInbox.values().next().value!.value,
        )
        if (!inbox) throw new Error(t`inbox not found (too soon?)`)

        await createContact({
          me: auth.webId!,
          other: webId,
          message: invitation,
          hospexContainer,
          inbox,
        })
      }),
      {
        pending: t`Adding contact.`,
        success: t`Contact added.`,
      },
    )

    // TODO send email notification about contact request

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
        disabled={myHospexDocuments.size === 0 || otherPersonInbox.size === 0}
      >
        <Trans>Add to my contacts</Trans>
      </Button>
      <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <AddContactForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </Modal>
    </>
  )
}
