import { Join } from 'components/Join/Join'
import { SignIn } from 'components/SignIn/SignIn'
import styles from './UnauthenticatedHome.module.scss'

export const UnauthenticatedHome = () => {
  return (
    <div className={styles.wrapper}>
      <section className={styles.mainDescription}>
        Sleepy Bike is a community of bicycle touring travellers and those who
        want to host them.
      </section>
      <section className={styles.actions}>
        <Join />
        <SignIn />
      </section>
      <div className={styles.projects}>
        <a href="https://openhospitality.network" className={styles.project}>
          <img
            src="https://openhospitality.network/assets/img/logo.png"
            title="Open Hospitality Network"
            alt="Open Hospitality Network logo"
            className={styles.logo}
          />
          <div>Open Hospitality Network</div>
        </a>
        <span className={styles.connection}>
          <span className={styles.plus}>+</span>
          <span />
        </span>
        <a href="https://solidproject.org" className={styles.project}>
          <img
            src="https://avatars3.githubusercontent.com/u/14262490?v=3&s=200"
            title="Solid Project"
            alt="Solid Project logo"
            className={styles.logo}
          />
          <div>Solid Project</div>
        </a>
      </div>
      {/*<!--As a member, you own your data. In the future, you'll be able to
          connect with other similar communities in the greater hospitality
  exchange network.-->*/}
      {/*<ButtonLink tertiary to="about">
        Read more
</ButtonLink>*/}
      <div className={styles.spacer} />
      <footer className={styles.footer}>
        Visit our project spaces to{' '}
        <a href="https://matrix.to/#/#ohn:matrix.org">
          ask a question or join the team
        </a>
        ,{' '}
        <a href="https://github.com/openHospitalityNetwork/sleepy.bike">
          view source code
        </a>{' '}
        or <a href="https://opencollective.com/ohn">support us financially</a>.
        <br />
        Follow us in the{' '}
        <a rel="me" href="https://floss.social/@sleepybike">
          Fediverse
        </a>{' '}
        or on{' '}
        <a rel="me" href="https://www.facebook.com/SleepyBikePage/">
          Facebook
        </a>.
      </footer>
    </div>
  )
}
