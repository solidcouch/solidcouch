import { Button } from '@/components'
import { Modal } from '@/components/Modal/Modal'
import { guessIssuer } from '@/components/SignIn/oidcIssuer'
import { useConfig } from '@/config/hooks'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { actions, selectLastSelectedIssuer } from '@/redux/loginSlice'
import { login } from '@inrupt/solid-client-authn-browser'
import { Trans, useLingui } from '@lingui/react/macro'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './SignIn.module.scss'

export const SignIn = () => {
  const { oidcIssuers, communityId, defaultCommunityName } = useConfig()
  const [modalOpen, setModalOpen] = useState(false)
  const [longList, setLongList] = useState(false)

  const { t } = useLingui()

  const lastIssuer = useAppSelector(selectLastSelectedIssuer)
  const isListedIssuer = oidcIssuers.some(iss => iss.issuer === lastIssuer)

  const { register, handleSubmit } = useForm<{ webIdOrIssuer: string }>({
    defaultValues: { webIdOrIssuer: !isListedIssuer ? lastIssuer : '' },
  })

  const dispatch = useAppDispatch()

  const community = useReadCommunity(communityId)

  // sign in on selecting a provider
  const handleSelectIssuer = async (oidcIssuer: string) => {
    const prevIssuer = lastIssuer ?? ''
    // remember oidcIssuer for next logins
    dispatch(actions.setLastSelectedIssuer(oidcIssuer))

    try {
      await login({
        oidcIssuer,
        redirectUrl: new URL('/', window.location.href).toString(),
        clientName: community.name || defaultCommunityName,
        clientId:
          import.meta.env.DEV && !import.meta.env.VITE_ENABLE_DEV_CLIENT_ID
            ? undefined
            : new URL('/clientid.jsonld', window.location.href).toJSON(),
      })
    } catch (e) {
      // if login redirect was unsuccessful, revert to previous issuer
      dispatch(actions.setLastSelectedIssuer(prevIssuer))
      if (e instanceof TypeError) {
        const message = e.message
        const errorString = e.toString()
        alert(
          t`We didn't succeed with redirecting to the issuer at ${oidcIssuer}.\nHave you provided correct webId or OIDCIssuer? Or is it down?\n\nReason: ${
            message
          }\n\nError: ${errorString}`,
        )
      } else alert(t`Something went wrong.\nError: ${e}`)
    }
  }

  const handleFormSubmit = handleSubmit(async ({ webIdOrIssuer }) => {
    try {
      const issuer = await guessIssuer(webIdOrIssuer, oidcIssuers)
      await handleSelectIssuer(issuer)
    } catch (e) {
      alert(t`Something went wrong.\nError: ${e}`)
    }
  })

  return (
    <>
      <Button secondary onClick={() => setModalOpen(true)}>
        <Trans>Sign in</Trans>
      </Button>
      <Modal
        isOpen={modalOpen}
        shouldCloseOnEsc
        shouldCloseOnOverlayClick
        onRequestClose={() => setModalOpen(false)}
      >
        <div className={styles.providers}>
          <Trans>Select your Solid identity provider</Trans>
          {lastIssuer && (
            <Button
              primary
              onClick={() => handleSelectIssuer(lastIssuer)}
              data-cy="pod-provider-button"
            >
              {
                // show issuer without protocol and trailing slash
                lastIssuer
                  .split('/')
                  .slice(2)
                  .filter(a => a)
                  .join('/')
              }
            </Button>
          )}
          {oidcIssuers
            .filter(iss => iss.issuer !== lastIssuer)
            // show featured issuers in short list, or all in long list
            .filter(iss => iss.featured || longList)
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
              <Trans>more</Trans>
            </Button>
          )}
          <Trans>
            or write your own Solid identity provider, or your webId
          </Trans>
          <form className={styles.webIdForm} onSubmit={handleFormSubmit}>
            <input
              type="text"
              placeholder={t`Your webId or provider`}
              {...register('webIdOrIssuer', { required: 'required' })}
            />
            <Button primary type="submit">
              <Trans>Continue</Trans>
            </Button>
          </form>
        </div>
      </Modal>
    </>
  )
}
