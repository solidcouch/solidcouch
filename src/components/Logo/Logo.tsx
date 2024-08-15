import cx from 'classnames'
import styles from './Logo.module.scss'

export const Logo = ({
  logo,
  focusedLogo,
  name,
  className,
}: {
  logo?: string
  focusedLogo?: string
  name?: string
  className?: string
}) => {
  if (!logo && !name) return null
  return (
    <div className={styles.logoContainer}>
      {logo && (
        <img
          src={logo}
          className={cx(
            styles.logo,
            focusedLogo ? styles.unfocusedLogo : null,
            className,
          )}
          alt={name ? `logo of ${name}` : ''}
        />
      )}
      {focusedLogo && (
        <img
          src={focusedLogo}
          className={cx(styles.logo, styles.focusedLogo, className)}
          alt={name ? `focused logo of ${name}` : ''}
        />
      )}
      {name ? <span>{name}</span> : null}
    </div>
  )
}
