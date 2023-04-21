import { skipToken } from '@reduxjs/toolkit/dist/query/react'
import { ldoApi } from 'app/services/ldoApi'
import classNames from 'classnames'
import { FaUserCircle } from 'react-icons/fa'
import { URI } from 'types'
import styles from './Avatar.module.scss'

export const Avatar = ({
  photo: photoUri,
  size = 1,
  square,
  className,
}: {
  photo?: URI
  size?: number
  square?: boolean
  className?: string
}) => {
  // fetch protected photo
  const { data: photo } = ldoApi.endpoints.readImage.useQuery(
    photoUri || skipToken,
  )

  return photo ? (
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
}
