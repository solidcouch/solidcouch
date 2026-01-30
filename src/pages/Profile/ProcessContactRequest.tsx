import { Button } from '@/components'
import { Modal } from '@/components/Modal/Modal'
import { Person } from '@/components/Person/Person'
import { withToast } from '@/components/withToast'
import { useConfig } from '@/config/hooks'
import { useHospexDocument } from '@/hooks/data/useCheckSetup'
import {
  useConfirmContact,
  useIgnoreContactRequest,
} from '@/hooks/data/useContacts'
import { useAuth } from '@/hooks/useAuth'
import { ContactInvitation } from '@/types'
import { getContainer } from '@/utils/helpers'
import { Trans, useLingui } from '@lingui/react/macro'
import { ReactNode, useState } from 'react'
import styles from './ProcessContactRequest.module.scss'

export const ProcessContactRequest = ({
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

  const { forCommunity: personalHospexDocuments } = useHospexDocument(
    auth.webId!,
    communityId,
  )

  const handleConfirm = async () => {
    const hospexContainer = getContainer(
      personalHospexDocuments.values().next().value!.value,
    )

    await withToast(
      Promise.resolve().then(async () => {
        if (!hospexContainer)
          throw new Error(t`hospex container not found (too soon?)`)
        await confirmContact({
          me: auth.webId!,
          other: contact.webId,
          notification: contact.notification,
          hospexContainer,
        })
      }),
      {
        pending: t`Confirming contact`,
        success: t`Contact confirmed`,
      },
    )
    setModalOpen(false)
  }
  const handleIgnore = async () => {
    await withToast(
      ignoreContact({
        notification: contact.notification,
      }),
      {
        pending: t`Ignoring contact request`,
        success: t`Contact request ignored`,
      },
    )
    setModalOpen(false)
  }

  return (
    <>
      <Button primary onClick={() => setModalOpen(true)}>
        {children ?? <Trans>See contact invitation</Trans>}
      </Button>

      <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <div className={styles.contactRequestModal}>
          <h2>
            <Trans>
              Contact request from{' '}
              <Person webId={contact.webId} showName popover />
            </Trans>
          </h2>

          <p>
            <Trans>
              <Person webId={contact.webId} showName popover /> wrote you:
            </Trans>
          </p>

          <p>{contact.invitation}</p>

          <div className={styles.actions}>
            <Button secondary onClick={handleIgnore}>
              <Trans>Ignore</Trans>
            </Button>
            <Button
              primary
              onClick={handleConfirm}
              disabled={personalHospexDocuments.size === 0}
            >
              <Trans>Accept</Trans>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
