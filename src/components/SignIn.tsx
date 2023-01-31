import { login } from '@inrupt/solid-client-authn-browser'
import { useState } from 'react'
import Modal from 'react-modal'

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
      <button onClick={() => setModalOpen(true)}>Sign in</button>
      <Modal
        isOpen={modalOpen}
        shouldCloseOnEsc
        shouldCloseOnOverlayClick
        onRequestClose={() => setModalOpen(false)}
      >
        <div>
          Select your preferred pod provider
          {oidcIssuers.map(({ name, url }) => (
            <button key={url} onClick={() => handleSelectProvider(url)}>
              {name}
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
