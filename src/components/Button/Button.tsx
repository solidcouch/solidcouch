import clsx from 'clsx'
import { AnchorHTMLAttributes, ComponentPropsWithRef } from 'react'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { IconType } from 'react-icons/lib'
import { Link, LinkProps } from 'react-router'
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
}: ComponentPropsWithRef<'button'> & ButtonProps) => {
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
 * A react-router Link styled to look like button
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

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>

export const ExternalLink = (props: ExternalLinkProps) => (
  <a target="_blank" rel="noopener noreferrer" {...props} />
)

/**
 * External link as icon, with target blank
 */
export const ExternalIconLink = ({
  icon: Icon = FaExternalLinkAlt,
  ...props
}: ExternalLinkProps & { icon?: IconType }) => (
  <ExternalLink {...props}>
    <Icon />
  </ExternalLink>
)

export const ExternalButtonLink = ({
  primary,
  secondary,
  tertiary,
  danger,
  className,
  ...props
}: ExternalLinkProps & ButtonProps) => {
  return (
    <ExternalLink
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
