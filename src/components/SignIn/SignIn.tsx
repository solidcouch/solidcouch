import { Button } from '@/components'
import { Modal } from '@/components/Modal/Modal'
import { guessIssuer } from '@/components/SignIn/oidcIssuer'
import { defaultLocale } from '@/config'
import { useConfig } from '@/config/hooks'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { useLocale } from '@/hooks/useLocale'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { actions, selectLastSelectedIssuer } from '@/redux/loginSlice'
import { URI } from '@/types'
import { login } from '@inrupt/solid-client-authn-browser'
import { Trans, useLingui } from '@lingui/react/macro'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Join } from '../Join/Join'
import joinStyles from '../Join/Join.module.scss'
import styles from './SignIn.module.scss'

export const SignIn = ({ buttonClassName }: { buttonClassName?: string }) => {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button
        className={buttonClassName}
        primary
        onClick={() => setModalOpen(true)}
      >
        <Trans>Sign in</Trans>
      </Button>
      <Modal
        isOpen={modalOpen}
        shouldCloseOnEsc
        shouldCloseOnOverlayClick
        onRequestClose={() => setModalOpen(false)}
      >
        <SignInForm />
      </Modal>
    </>
  )
}

export const SignInForm = ({
  short,
  onSuccess,
  onError,
}: {
  short?: boolean
  onSuccess?: () => Promise<void> | void
  onError?: () => Promise<void> | void
}) => {
  const { oidcIssuers, communityId, defaultCommunityName } = useConfig()

  const { t } = useLingui()

  const lastIssuer = useAppSelector(selectLastSelectedIssuer)

  const { register, handleSubmit, setValue, watch } = useForm<{
    webIdOrIssuer: string
  }>({ defaultValues: { webIdOrIssuer: lastIssuer } })

  useEffect(() => {
    if (lastIssuer) setValue('webIdOrIssuer', lastIssuer)
  }, [lastIssuer, setValue])

  const dispatch = useAppDispatch()
  const locale = useLocale()
  const community = useReadCommunity(communityId, locale, defaultLocale)
  const communityName = community.name || defaultCommunityName

  // sign in on selecting a provider
  const handleSelectIssuer = async (
    oidcIssuer: string,
    originalValue?: string,
  ) => {
    // remember oidcIssuer for next logins
    dispatch(actions.setLastSelectedIssuer(oidcIssuer))

    // save url to get back to it after login
    const currentUrl = globalThis.location.href
    // eslint-disable-next-line lingui/no-unlocalized-strings
    globalThis.sessionStorage.setItem('previousUrl', currentUrl)

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

      await onSuccess?.()
    } catch (e) {
      // if login redirect was unsuccessful, clear the issuer and revert to original input
      dispatch(actions.setLastSelectedIssuer(''))
      if (originalValue) setValue('webIdOrIssuer', originalValue)

      if (e instanceof TypeError) {
        const message = e.message
        const errorString = e.toString()
        alert(
          t`We didn't succeed with redirecting to the issuer at ${oidcIssuer}.\nHave you provided correct webId or OIDCIssuer? Or is it down?\n\nReason: ${
            message
          }\n\nError: ${errorString}`,
        )
      } else alert(t`Something went wrong.\nError: ${e}`)

      await onError?.()
    }
  }

  const handleFormSubmit = handleSubmit(async ({ webIdOrIssuer }) => {
    try {
      const issuer = await guessIssuer(webIdOrIssuer, oidcIssuers)
      await handleSelectIssuer(issuer, webIdOrIssuer)
    } catch (e) {
      alert(t`Something went wrong.\nError: ${e}`)
    }
  })

  return (
    <div className={styles.container}>
      {!short && (
        <>
          <h2>
            <Trans>Sign in to {communityName}</Trans>
          </h2>
          <div>
            <Trans>Choose your Solid provider or WebID</Trans>
          </div>
          <IdentityProviders
            selected={watch('webIdOrIssuer')}
            onSelect={(url: URI) => {
              setValue('webIdOrIssuer', url)
            }}
          />
        </>
      )}
      <form className={styles.webIdForm} onSubmit={handleFormSubmit}>
        <input
          type="text"
          data-testid="webid-idp-input"
          placeholder={t`e.g. solidcommunity.net`}
          {...register('webIdOrIssuer', { required: 'required' })}
        />
        <Button primary type="submit" disabled={!watch('webIdOrIssuer')}>
          <Trans>Continue</Trans>
        </Button>
      </form>
      {!short && (
        <Join>
          <Trans>Don't have a Solid Pod yet?</Trans>
        </Join>
      )}
    </div>
  )
}

const IdentityProviders = ({
  selected,
  onSelect,
}: {
  selected?: URI
  onSelect?: (url: URI) => Promise<void> | void
}) => {
  const { oidcIssuers } = useConfig()
  const [longList, setLongList] = useState(false)

  return (
    <ul className={joinStyles.providerList}>
      {oidcIssuers
        // show featured issuers in short list, or all in long list
        .filter(iss => iss.featured || longList)
        .map(({ issuer: url }) => (
          <li key={url}>
            <Button
              className={joinStyles.provider}
              secondary={selected !== url}
              onClick={() => onSelect?.(url)}
              primary={selected === url}
              data-testid={
                selected === url ? 'selected-pod-provider' : undefined
              }
            >
              {new URL(url).hostname}
            </Button>
          </li>
        ))}
      {!longList && (
        <li>
          <Button
            tertiary
            onClick={() => setLongList(true)}
            className={joinStyles.provider}
          >
            <Trans>more</Trans>
          </Button>
        </li>
      )}
    </ul>
  )
}
