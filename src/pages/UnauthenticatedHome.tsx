import { Join } from 'components/Join/Join'
import { SignIn } from 'components/SignIn/SignIn'
import { ReactComponent as Logo } from 'logo.svg'
import styles from './UnauthenticatedHome.module.scss'

export const UnauthenticatedHome = () => {
  return (
    <div className={styles.wrapper}>
      <section className={styles.mainDescription}>
        SolidCouch is a decentralized hospitality exchange community app.
      </section>

      <Logo style={{ width: '150px' }} />

      <section className={styles.actions}>
        <Join />
        <SignIn />
      </section>
      <div className={styles.spacer} />
      <footer className={styles.footer}>
        <div>WIP</div>
        <div>
          <a href="https://solidcouch.org">solidcouch.org</a>
        </div>
        <div>
          <a href="https://github.com/solidcouch/solidcouch">source code</a>
        </div>
      </footer>
    </div>
  )
}
