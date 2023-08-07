import { ButtonLink } from 'components'
import { SignIn } from 'components/SignIn/SignIn'
import styles from './UnauthenticatedHome.module.scss'

export const UnauthenticatedHome = () => {
  return (
    <div className={styles.wrapper}>
      <section className={styles.mainDescription}></section>
      <section className={styles.actions}>
        <SignIn />
      </section>
      <ButtonLink tertiary to="about">
        Read more
      </ButtonLink>
      <div className={styles.spacer} />
      <footer className={styles.footer}></footer>
    </div>
  )
}
