import { login } from '@inrupt/solid-client-authn-browser'
import { Button } from 'components'
import { readOidcIssuer } from 'components/SignIn/oidcIssuer'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from 'react-modal'
import { URI } from 'types'
import styles from './SignIn.module.scss'

Modal.setAppElement('#root')

const oidcIssuers = [
  { name: 'solidcommunity.net', url: 'https://solidcommunity.net' },
  { name: 'solidweb.me', url: 'https://solidweb.me' },
]

const guessIssuer = async (webIdOrIssuer: URI): Promise<URI> => {
  try {
    // assume that the address is webId
    const oidcIssuers = await readOidcIssuer(webIdOrIssuer)
    if (oidcIssuers.length === 0) throw new Error('OIDC issuer not found')
    return oidcIssuers[0]
  } catch {
    // default to initial URI
    return webIdOrIssuer
  }
}

export const SignIn = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const { register, handleSubmit } = useForm<{ webIdOrIssuer: string }>()

  // sign in on selecting a provider
  const handleSelectIssuer = async (oidcIssuer: string) => {
    await login({
      oidcIssuer,
      redirectUrl: window.location.href,
      clientName: 'sleepy.bike',
    })
  }

  const handleFormSubmit = handleSubmit(async ({ webIdOrIssuer }) => {
    const issuer = await guessIssuer(webIdOrIssuer)

    try {
      await handleSelectIssuer(issuer)
    } catch (e) {
      alert(
        "We didn't succeed with redirecting to the issuer. Have you provided correct webId or OIDCIssuer?",
      )
    }
  })

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
          Select your Solid identity provider
          {oidcIssuers.map(({ name, url }) => (
            <Button secondary key={url} onClick={() => handleSelectIssuer(url)}>
              {name}
            </Button>
          ))}
          or write your own Solid identity provider, or your webId
          <form className={styles.webIdForm} onSubmit={handleFormSubmit}>
            <input
              type="url"
              placeholder="Your webId or provider"
              {...register('webIdOrIssuer', { required: 'required' })}
            />
            <Button primary type="submit">
              Continue
            </Button>
          </form>
        </div>
      </Modal>
    </>
  )
}
