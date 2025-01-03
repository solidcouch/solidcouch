import { useFile } from '@/hooks/data/useFile'
import { URI } from '@/types'
import clsx from 'clsx'
import { FaUserCircle } from 'react-icons/fa'
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
  const { data: photo } = useFile(photoUri)

  return photo ? (
    <img
      className={clsx(styles.photo, square && styles.square, className)}
      src={photo}
      alt=""
      style={{ width: `${size * 2}rem`, height: `${size * 2}rem` }}
    />
  ) : (
    <FaUserCircle className={clsx(styles.photo, className)} size={size * 32} />
  )
}
