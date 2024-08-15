import { Join } from 'components/Join/Join'
import { Logo } from 'components/Logo/Logo'
import { SignIn } from 'components/SignIn/SignIn'
import { useConfig } from 'config/hooks'
import { useReadCommunity } from 'hooks/data/useCommunity'
import { useMemo } from 'react'
import styles from './UnauthenticatedHome.module.scss'

export const UnauthenticatedHome = () => {
  const { communityId } = useConfig()
  const community = useReadCommunity(communityId)

  const logo = useMemo(
    () => (
      <Logo
        className={styles.logo}
        logo={community.logo[0]}
        focusedLogo={community.logo[1]}
      />
    ),
    [community.logo],
  )

  const pun = useMemo(
    () =>
      community.pun ? (
        <section className={styles.pun}>{community.pun}</section>
      ) : undefined,
    [community.pun],
  )

  const mainDescription = useMemo(
    () =>
      community.about ? (
        <section className={styles.mainDescription}>{community.about}</section>
      ) : null,
    [community.about],
  )

  const overview = pun ? (
    <>
      {pun}
      {logo}
      {mainDescription}
    </>
  ) : (
    <>
      {mainDescription}
      {logo}
    </>
  )

  return (
    <div className={styles.wrapper}>
      {overview}
      <section className={styles.actions}>
        <Join />
        <SignIn />
      </section>
      <div className={styles.spacer} />
      <footer className={styles.footer}>
        {/* Visit our project spaces to{' '}
        <a href="https://matrix.to/#/#todo:matrix.org">
          ask a question or join the team
        </a>,
        {/* or <a href="https://opencollective.com/todo">support us financially</a>. */}
        {/* <br />
        Follow us in the{' '}
        <a rel="me" href="https://floss.social/@todo">
          Fediverse
        </a>{' '}
        or on{' '}
        <a rel="me" href="https://www.facebook.com/todo/">
          Facebook
        </a>. */}
        <div className={styles.footerInfo}>WIP</div>
        <div className={styles.attribution}>
          Powered by <a href="https://github.com/solidcouch">SolidCouch</a>
        </div>
      </footer>
    </div>
  )
}
