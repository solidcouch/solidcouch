import classNames from 'classnames'
import { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.scss'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  primary?: boolean
  secondary?: boolean
  tertiary?: boolean
}

export const Button = ({
  primary,
  secondary,
  tertiary,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={classNames(
        className,
        styles.button,
        primary && styles.primary,
        secondary && styles.secondary,
        tertiary && styles.tertiary,
      )}
      {...props}
    />
  )
}
