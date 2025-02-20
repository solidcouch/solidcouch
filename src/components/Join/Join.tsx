import { Button } from '@/components'
import { ExternalButtonLink } from '@/components/Button/Button.tsx'
import { Modal } from '@/components/Modal/Modal'
import type { IssuerConfig } from '@/config'
import { useConfig } from '@/config/hooks'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { useAppDispatch } from '@/redux/hooks'
import { actions } from '@/redux/loginSlice'
import { Trans, useLingui } from '@lingui/react/macro'
import { ChangeEvent, Fragment, ReactNode, useMemo, useState } from 'react'
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

const useTabs = () => {
  const { oidcIssuers, communityId } = useConfig()
  const { t } = useLingui()

  const community = useReadCommunity(communityId)
  const communityName = community.name || 'SolidCouch'

  const tabs = useMemo(
    () => [
      {
        id: 'show-options',
        label: t`Show me some providers!`,
        content: (
          <>
            <Trans>
              Here are some Pod providers that work with {communityName}:
            </Trans>
            <ul>
              {oidcIssuers
                .filter(iss => iss.registration)
                .map(issuerConfig => (
                  <li key={issuerConfig.issuer}>
                    <RegistrationButton {...issuerConfig} />
                  </li>
                ))}
            </ul>
          </>
        ),
      },
      {
        id: 'choose-for-me',
        label: t`Choose for me!`,
        // TODO put this label and description into config
        content: (
          <>
            <RegistrationButton {...oidcIssuers.find(iss => iss.recommended)!}>
              <Trans>Get a Pod at solidcommunity.net 😉</Trans>
            </RegistrationButton>
            <br />
            <Trans>
              It is managed by the Solid community folks, and has been migrated
              to a{' '}
              <a
                href="https://github.com/solid-contrib/pivot"
                target="_blank"
                rel="noopener noreferrer"
              >
                modern and open-source Solid server
              </a>
              .
            </Trans>
          </>
        ),
      },
      {
        id: 'more-control',
        label: t`I want more control`,
        content: (
          <>
            <p>
              <Trans>
                You can <b>host your Pod</b>. This will give you full control
                over your data. However, it's more complicated to set up, and
                requires maintenance. We recommend{' '}
                <a
                  href="https://github.com/communitysolidserver/communitysolidserver#-running-the-server"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Community Solid Server
                </a>
                .
              </Trans>
            </p>
            <p>
              <i>
                <Trans>
                  Read more about{' '}
                  <a
                    href="https://solidproject.org/self-hosting/css"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    running your own Solid server
                  </a>
                  .
                </Trans>
              </i>
            </p>
            <hr />
            <p>
              <Trans>
                If you own a <b>domain name</b>, you can have your{' '}
                <a
                  href="https://solidproject.org/TR/protocol#webid"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WebID
                </a>{' '}
                on your domain. This gives you more control over your Solid
                identity.
              </Trans>
            </p>
            <p>
              <Trans>
                Choose option <i>"Use my existing WebID to access my Pod"</i>{' '}
                with one of these providers:
              </Trans>
            </p>
            <ul>
              {oidcIssuers
                .filter(
                  ({ server, registration }) =>
                    registration && server === 'CSS',
                )
                .map(issuerConfig => (
                  <li key={issuerConfig.issuer}>
                    <RegistrationButton {...issuerConfig} />
                  </li>
                ))}
            </ul>
            <p>
              <Trans>
                To complete the process, you must prove that the WebID on your
                domain belongs to you. Afterwards, the WebID must point to your
                Profile Document. (This may need more explanation.)
              </Trans>
            </p>
            <p>
              <Trans>Or use your domain to host your own Solid Pod.</Trans>
            </p>
          </>
        ),
      },
    ],
    [communityName, oidcIssuers, t],
  )

  return tabs
}

export const Join = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>()

  const { communityId } = useConfig()
  const community = useReadCommunity(communityId)
  const communityName = community.name || 'SolidCouch'

  const handleTabChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedTab(event.target.value)
  }

  const tabs = useTabs()

  return (
    <>
      <Button primary onClick={() => setModalOpen(true)}>
        <Trans>Join</Trans>
      </Button>
      <Modal
        isOpen={modalOpen}
        shouldCloseOnEsc
        shouldCloseOnOverlayClick
        onRequestClose={() => setModalOpen(false)}
      >
        <div className={styles.container}>
          <div className={styles.content}>
            <Trans>
              To join {communityName}, you need a{' '}
              <a
                href="https://solidproject.org/users/get-a-pod"
                target="_blank"
                rel="noopener noreferrer"
              >
                Solid Pod
              </a>
              .
            </Trans>
            <div className={styles.podOptions}>
              <div className={styles.tabs}>
                {tabs.map(tab => (
                  <Fragment key={tab.id}>
                    <input
                      type="radio"
                      id={tab.id}
                      value={tab.id}
                      checked={selectedTab === tab.id}
                      onChange={handleTabChange}
                    />
                    <label htmlFor={tab.id}>{tab.label}</label>
                  </Fragment>
                ))}
              </div>
              <div className={styles.tabContent}>
                <p>{tabs.find(tab => tab.id === selectedTab)?.content}</p>
              </div>
            </div>
          </div>
          <div className={styles.footer}>
            <Trans>Do you have troubles joining?</Trans>{' '}
            <Trans>
              <a
                href="https://matrix.to/#/#ohn:matrix.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ask for help in our project spaces
              </a>{' '}
              or write us email to{' '}
              <i className={styles.email}>"support at solidcouch dot org"</i>
            </Trans>
          </div>
        </div>
      </Modal>
    </>
  )
}
