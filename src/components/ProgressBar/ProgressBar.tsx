import clsx from 'clsx'
import styles from './ProgressBar.module.scss'

export const ProgressBar = ({ animate = false }) => (
  <div className={clsx(styles.bar, animate && styles.animate)} />
)
