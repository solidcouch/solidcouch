import { useFile } from '@/hooks/data/useFile'
import { URI } from '@/types'
import clsx from 'clsx'
import { Avatar as A } from 'radix-ui'
import { FaUser } from 'react-icons/fa'
import styles from './Avatar.module.scss'

export const Avatar = ({
  photo: photoUri,
  name,
  size = 1,
  square,
  className,
}: {
  name?: string
  photo?: URI
  size?: number
  square?: boolean
  className?: string
}) => {
  // fetch protected photo
  const { data: photo } = useFile(photoUri)

  const initials = name
    ?.split(/\s+/)
    .map(n => n[0])
    .join('')

  return (
    <A.Root
      className={clsx(styles.avatarRoot, square && styles.square, className)}
      style={{ width: `${size * 2}rem`, height: `${size * 2}rem` }}
    >
      <A.Image src={photo} alt={name} className={styles.avatarImage} />
      <A.Fallback className={styles.avatarFallback}>
        {initials || <FaUser size={size * 32} />}
      </A.Fallback>
    </A.Root>
  )
}
