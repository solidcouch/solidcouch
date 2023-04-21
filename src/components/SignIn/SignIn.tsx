import { login } from '@inrupt/solid-client-authn-browser'
import { ldoApi } from 'app/services/ldoApi'
import { Button } from 'components'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from 'react-modal'
import styles from './SignIn.module.scss'

Modal.setAppElement('#root')

const oidcIssuers = [
  { name: 'solidcommunity.net', url: 'https://solidcommunity.net' },
  { name: 'solidweb.me', url: 'https://solidweb.me' },
]

const useGuessIssuer = () => {
  const [readOidcIssuer] = ldoApi.endpoints.readOidcIssuer.useLazyQuery()

  return async (webIdOrIssuer: string): Promise<string> => {
    let issuer: string
    try {
      // first we assume that the provider is
      const profile = await readOidcIssuer(webIdOrIssuer).unwrap()
      issuer = profile.oidcIssuer[0]['@id']
    } catch {
      issuer = webIdOrIssuer
    }

    return issuer
  }
}

export const SignIn = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const { register, handleSubmit } = useForm<{ webIdOrIssuer: string }>()

  const guessIssuer = useGuessIssuer()

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
