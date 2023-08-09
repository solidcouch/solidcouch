import { login } from '@inrupt/solid-client-authn-browser'
import { Button } from 'components'
import { readOidcIssuer } from 'components/SignIn/oidcIssuer'
import { oidcIssuers } from 'config'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from 'react-modal'
import { URI } from 'types'
import styles from './SignIn.module.scss'

Modal.setAppElement('#root')

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
  const [longList, setLongList] = useState(false)

  const { register, handleSubmit } = useForm<{ webIdOrIssuer: string }>()

  // sign in on selecting a provider
  const handleSelectIssuer = async (oidcIssuer: string) => {
    try {
      await login({
        oidcIssuer,
        redirectUrl: window.location.href,
        clientName: 'sleepy.bike',
      })
    } catch (e) {
      if (e instanceof TypeError) {
        alert(
          "We didn't succeed with redirecting to the issuer. Have you provided correct webId or OIDCIssuer? Or is it down?",
        )
      } else throw e
    }
  }

  const handleFormSubmit = handleSubmit(async ({ webIdOrIssuer }) => {
    const issuer = await guessIssuer(webIdOrIssuer)

    try {
      await handleSelectIssuer(issuer)
    } catch (e) {
      alert(JSON.stringify(e))
    }
  })

  return (
    <>
      <Button secondary onClick={() => setModalOpen(true)}>
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
          {oidcIssuers
            .slice(longList ? undefined : 0, longList ? undefined : 2)
            .map(({ issuer: url }) => (
              <Button
                secondary
                key={url}
                onClick={() => handleSelectIssuer(url)}
              >
                {new URL(url).hostname}
              </Button>
            ))}
          {!longList && (
            <Button tertiary onClick={() => setLongList(true)}>
              more
            </Button>
          )}
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
