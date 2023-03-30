import classNames from 'classnames'
import { FaUserCircle } from 'react-icons/fa'
import { URI } from 'types'
import styles from './Avatar.module.scss'

export const Avatar = ({
  photo,
  size = 1,
  square,
  className,
}: {
  photo?: URI
  size?: number
  square?: boolean
  className?: string
}) =>
  photo ? (
    <img
      className={classNames(styles.photo, square && styles.square, className)}
      src={photo}
      alt=""
      style={{ width: `${size * 2}rem`, height: `${size * 2}rem` }}
    />
  ) : (
    <FaUserCircle
      className={classNames(styles.photo, className)}
      size={size * 32}
    />
  )
