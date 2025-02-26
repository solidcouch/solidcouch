import clsx from 'clsx'
import { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { IconType } from 'react-icons/lib'
import { Link, LinkProps } from 'react-router-dom'
import styles from './Button.module.scss'

type ButtonProps = {
  primary?: boolean
  danger?: boolean
  secondary?: boolean
  tertiary?: boolean
}

export const Button = ({
  primary,
  secondary,
  tertiary,
  danger,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & ButtonProps) => {
  return (
    <button
      className={clsx(
        className,
        styles.button,
        primary && styles.primary,
        danger && styles.danger,
        secondary && styles.secondary,
        tertiary && styles.tertiary,
      )}
      {...props}
    />
  )
}

/**
 * A react-router-dom Link styled to look like button
 */
export const ButtonLink = ({
  primary,
  secondary,
  tertiary,
  danger,
  className,
  ...props
}: LinkProps & ButtonProps) => {
  return (
    <Link
      className={clsx(
        className,
        styles.button,
        primary && styles.primary,
        danger && styles.danger,
        secondary && styles.secondary,
        tertiary && styles.tertiary,
      )}
      {...props}
    />
  )
}

/**
 * External link as icon, with target blank
 */
export const ExternalIconLink = ({
  icon: Icon = FaExternalLinkAlt,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { icon?: IconType }) => (
  <a target="_blank" rel="noopener noreferrer" {...props}>
    <Icon />
  </a>
)

export const ExternalButtonLink = ({
  primary,
  secondary,
  tertiary,
  danger,
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & ButtonProps) => {
  return (
    <a
      className={clsx(
        className,
        styles.button,
        primary && styles.primary,
        danger && styles.danger,
        secondary && styles.secondary,
        tertiary && styles.tertiary,
      )}
      {...props}
    >
      {children}
    </a>
  )
}
