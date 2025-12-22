import { Button } from '@/components'
import { ExternalButtonLink } from '@/components/Button/Button.tsx'
import { Modal } from '@/components/Modal/Modal'
import { defaultLocale, type IssuerConfig } from '@/config'
import { useConfig } from '@/config/hooks'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { useLocale } from '@/hooks/useLocale'
import { useAppDispatch } from '@/redux/hooks'
import { actions } from '@/redux/loginSlice'
import { Trans } from '@lingui/react/macro'
import { ReactNode, useState } from 'react'
import styles from './Join.module.scss'

const RegistrationButton = ({
  issuer,
  registration,
  children,
}: Pick<IssuerConfig, 'issuer' | 'registration'> & {
  children?: ReactNode
}) => {
  const dispatch = useAppDispatch()

  return (
    <ExternalButtonLink
      className={styles.provider}
      secondary
      href={registration!}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        dispatch(actions.setLastSelectedIssuer(issuer))
      }}
      data-cy="pod-provider-signup-link"
    >
      {children ?? new URL(issuer).hostname}
    </ExternalButtonLink>
  )
}

export const Join = ({ children }: { children: ReactNode }) => {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button tertiary onClick={() => setModalOpen(true)}>
        {children}
      </Button>
      <Modal
        isOpen={modalOpen}
        shouldCloseOnEsc
        shouldCloseOnOverlayClick
        onRequestClose={() => setModalOpen(false)}
      >
        <JoinInfo />
      </Modal>
    </>
  )
}

const JoinInfo = () => {
  const locale = useLocale()
  const { communityId, defaultCommunityName, oidcIssuers } = useConfig()
  const community = useReadCommunity(communityId, locale, defaultLocale)
  const communityName = community.name || defaultCommunityName

  return (
    <div className={styles.container}>
      <header>
        <h1>
          <Trans>Join {communityName}</Trans>
        </h1>
      </header>

      <article className={styles.content}>
        <p>
          <Trans>
            To join {communityName}, you need a{' '}
            <a
              href="https://solidproject.org/users/get-a-pod"
              target="_blank"
              rel="noopener noreferrer"
            >
              Solid Pod
            </a>{' '}
            &mdash; a place to store your data.
          </Trans>{' '}
        </p>
        <Trans>Choose a Pod provider:</Trans>
        <ul className={styles.providerList}>
          {oidcIssuers
            .filter(iss => iss.registration)
            .map(issuerConfig => (
              <li key={issuerConfig.issuer}>
                <RegistrationButton {...issuerConfig} />
              </li>
            ))}
        </ul>
        <p>
          <Trans>
            You can also{' '}
            <a
              href="https://solidcouch.org/solid-pod#host-your-solid-pod"
              target="_blank"
              rel="noopener noreferrer"
            >
              host your own Pod
            </a>
            .
          </Trans>
        </p>
      </article>
      <hr />
      <footer className={styles.footer}>
        <Trans>Need help?</Trans>{' '}
        <Trans>
          <a
            href="https://matrix.to/#/#solidcouch:matrix.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Reach us in our project spaces
          </a>{' '}
          or write us email to{' '}
          <i className={styles.email}>"support at solidcouch dot org"</i>.
        </Trans>
      </footer>
    </div>
  )
}
