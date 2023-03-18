import classNames from 'classnames'
import { FaUserCircle } from 'react-icons/fa'
import { URI } from 'types'
import styles from './Avatar.module.scss'

export const Avatar = ({
  photo,
  size = 1,
  square,
}: {
  photo?: URI
  size?: number
  square?: boolean
}) =>
  photo ? (
    <img
      className={classNames(styles.photo, square && styles.square)}
      src={photo}
      alt=""
      style={{ width: `${size * 2}rem`, height: `${size * 2}rem` }}
    />
  ) : (
    <FaUserCircle className={styles.photo} size={size * 32} />
  )
