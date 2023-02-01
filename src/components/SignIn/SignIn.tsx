import { login } from '@inrupt/solid-client-authn-browser'
import { Button } from 'components'
import { useState } from 'react'
import Modal from 'react-modal'
import styles from './SignIn.module.scss'

Modal.setAppElement('#root')

const oidcIssuers = [
  { name: 'solid community', url: 'https://solidcommunity.net' },
  { name: 'solidweb.me', url: 'https://solidweb.me' },
]

export const SignIn = () => {
  const [modalOpen, setModalOpen] = useState(false)

  // sign in on selecting a provider
  const handleSelectProvider = (oidcIssuer: string) => {
    login({
      oidcIssuer,
      redirectUrl: window.location.href,
      clientName: 'sleepy.bike',
    })
  }

  return (
    <>
      <Button primary onClick={() => setModalOpen(true)}>
        Sign in
      </Button>
      <Modal
        isOpen={modalOpen}
        shouldCloseOnEsc
        shouldCloseOnOverlayClick
        onRequestClose={() => setModalOpen(false)}
      >
        <div className={styles.providers}>
          Select your Solid Pod provider
          {oidcIssuers.map(({ name, url }) => (
            <Button
              secondary
              key={url}
              onClick={() => handleSelectProvider(url)}
            >
              {name}
            </Button>
          ))}
        </div>
      </Modal>
    </>
  )
}
