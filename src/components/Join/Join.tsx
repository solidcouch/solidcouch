import { useAppDispatch } from 'app/hooks'
import { Button } from 'components'
import { ExternalButtonLink } from 'components/Button/Button'
import { oidcIssuers, type IssuerConfig } from 'config'
import { actions } from 'features/login/loginSlice'
import { ChangeEvent, Fragment, ReactNode, useState } from 'react'
import Modal from 'react-modal'
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
    >
      {children ?? new URL(issuer).hostname}
    </ExternalButtonLink>
  )
}

const tabs = [
  {
    id: 'show-options',
    label: 'Show me some providers!',
    content: (
      <>
        Here are some Pod providers that work with sleepy.bike:
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
    label: 'Choose for me!',
    // TODO put this label and description into config
    content: (
      <>
        <RegistrationButton {...oidcIssuers.find(iss => iss.recommended)!}>
          Get a Pod at solidcommunity.net 😉
        </RegistrationButton>
        <br />
        It is managed by the Solid community folks, and will be migrated to a{' '}
        <a
          href="https://github.com/solid-contrib/pivot"
          target="_blank"
          rel="noopener noreferrer"
        >
          modern and open-source Solid server
        </a>
        .
      </>
    ),
  },
  {
    id: 'more-control',
    label: 'I want more control',
    content: (
      <>
        <p>
          You can <b>host your Pod</b>. This will give you full control over
          your data. However, it's more complicated to set up, and requires
          maintenance. We recommend{' '}
          <a
            href="https://github.com/communitysolidserver/communitysolidserver#-running-the-server"
            target="_blank"
            rel="noopener noreferrer"
          >
            Community Solid Server
          </a>
          .
        </p>
        <p>
          <i>
            Read more about{' '}
            <a
              href="https://solidproject.org/self-hosting/css"
              target="_blank"
              rel="noopener noreferrer"
            >
              running your own Solid server
            </a>
            .
          </i>
        </p>
        <hr />
        <p>
          If you own a <b>domain name</b>, you can have your{' '}
          <a
            href="https://solidproject.org/TR/protocol#webid"
            target="_blank"
            rel="noopener noreferrer"
          >
            WebID
          </a>{' '}
          on your domain. This gives you more control over your Solid identity.
        </p>
        <p>
          Choose option <i>"Use my existing WebID to access my Pod"</i> with one
          of these providers:
        </p>
        <ul>
          {oidcIssuers
            .filter(
              ({ server, registration }) => registration && server === 'CSS',
            )
            .map(issuerConfig => (
              <li key={issuerConfig.issuer}>
                <RegistrationButton {...issuerConfig} />
              </li>
            ))}
        </ul>
        <p>
          To complete the process, you must prove that the WebID on your domain
          belongs to you. Afterwards, the WebID must point to your Profile
          Document. (This may need more explanation.)
        </p>
        <p>Or use your domain to host your own Solid Pod.</p>
      </>
    ),
  },
]

export const Join = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>()

  const handleTabChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedTab(event.target.value)
  }

  return (
    <>
      <Button primary onClick={() => setModalOpen(true)}>
        Join
      </Button>
      <Modal
        isOpen={modalOpen}
        shouldCloseOnEsc
        shouldCloseOnOverlayClick
        onRequestClose={() => setModalOpen(false)}
      >
        <div className={styles.container}>
          <div className={styles.content}>
            To join Sleepy Bike, you need a{' '}
            <a
              href="https://solidproject.org/users/get-a-pod"
              target="_blank"
              rel="noopener noreferrer"
            >
              Solid Pod
            </a>
            .
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
            Do you have troubles joining?{' '}
            <a
              href="https://matrix.to/#/#ohn:matrix.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask for help in our project spaces
            </a>{' '}
            or write us email to{' '}
            <i className={styles.email}>"support at sleepy dot bike"</i>
          </div>
        </div>
      </Modal>
    </>
  )
}
