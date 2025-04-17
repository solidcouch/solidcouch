import { Join } from '@/components/Join/Join.tsx'
import { Logo } from '@/components/Logo/Logo.tsx'
import { SignIn } from '@/components/SignIn/SignIn.tsx'
import { defaultLocale } from '@/config'
import { useConfig } from '@/config/hooks'
import { commitHash, commitHashShort, version } from '@/config/variables'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'
import { Trans } from '@lingui/react/macro'
import { useMemo } from 'react'
import styles from './UnauthenticatedHome.module.scss'

export const UnauthenticatedHome = () => {
  const { communityId } = useConfig()
  const locale = useAppSelector(selectLocale)
  const community = useReadCommunity(communityId, locale, defaultLocale)

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
        <div className={styles.footerInfo}>
          <Trans>WIP</Trans>
        </div>
        <div className={styles.attribution}>
          <Trans>
            Powered by <a href="https://github.com/solidcouch">SolidCouch</a> v
            {version} (
            <a
              href={`https://github.com/solidcouch/solidcouch/commit/${commitHash}`}
            >
              {commitHashShort}
            </a>
            )
          </Trans>
        </div>
      </footer>
    </div>
  )
}
