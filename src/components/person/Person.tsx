import { Avatar, ButtonLink } from '@/components'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { Profile } from '@/pages/Profile/Profile'
import { URI } from '@/types'
import { Trans, useLingui } from '@lingui/react/macro'
import clsx from 'clsx'
import { Popover } from 'radix-ui'
import { FaTimes } from 'react-icons/fa'
import { Link } from 'react-router'
import encodeURIComponent from 'strict-uri-encode'
import interestStyles from '../Interests/Interest.module.scss'
import styles from './Person.module.scss'

type PersonProps = {
  webId: URI
  size?: number
  square?: boolean
  showName?: boolean
  link?: boolean
  popover?: boolean
  className?: string
  avatarClassName?: string
  nameClassName?: string
  linkClassName?: string
}

export const Person = ({
  webId,
  size = 1,
  square,
  showName = false,
  link = false,
  popover = false,
  className,
  avatarClassName,
  nameClassName,
  linkClassName,
}: PersonProps) => {
  const { communityId } = useConfig()
  const [person] = useProfile(webId, communityId)

  const { t } = useLingui()

  const avatar = (
    <Avatar
      photo={person.photo}
      name={person.name}
      square={square}
      size={size}
      className={avatarClassName}
    />
  )

  // eslint-disable-next-line lingui/no-unlocalized-strings
  const linkHref = `/profile/${encodeURIComponent(webId)}`

  // eslint-disable-next-line lingui/no-unlocalized-strings
  const WrapperComponent = popover ? 'button' : 'div'

  const display = showName ? (
    <WrapperComponent className={clsx(styles.container, className)}>
      {avatar}
      <span className={clsx(styles.name, nameClassName)}>{person?.name}</span>
    </WrapperComponent>
  ) : (
    <WrapperComponent className={clsx(className)}>{avatar}</WrapperComponent>
  )

  if (link)
    return (
      <Link to={linkHref} className={clsx(styles.link, linkClassName)}>
        {display}
      </Link>
    )

  if (popover)
    return (
      <Popover.Root>
        <Popover.Trigger asChild>{display}</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content sideOffset={8} className={interestStyles.popover}>
            <Popover.Close
              className={interestStyles.close}
              aria-label={t`Close`}
            >
              <FaTimes />
            </Popover.Close>
            <Profile
              webId={webId}
              readonly
              imageClassName={styles.profileImage}
            />
            <ButtonLink to={linkHref} secondary style={{ marginTop: '1rem' }}>
              <Trans>Open profile</Trans>
            </ButtonLink>
            <Popover.Arrow className={interestStyles.arrow} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    )

  return display
}
