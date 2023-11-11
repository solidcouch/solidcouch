import classNames from 'classnames'
import styles from './ProgressBar.module.scss'

export const ProgressBar = ({ animate = false }) => (
  <div className={classNames(styles.bar, animate && styles.animate)} />
)
