// inspired by https://stackoverflow.com/a/24979148

import classNames from 'classnames'
import { HTMLProps, ReactNode } from 'react'
import styles from './Layout.module.scss'

interface ChildrenProps {
  children?: ReactNode
}

export const Layout = ({
  children,
  page,
}: ChildrenProps & { page?: boolean }) => {
  return (
    <div className={classNames(styles.box, page && styles.page)}>
      {children}
    </div>
  )
}

export const Header = ({ children }: ChildrenProps) => (
  <div className={classNames(styles.row, styles.header)}>{children}</div>
)

export const Content = ({ children }: ChildrenProps) => (
  <div className={classNames(styles.row, styles.content)}>{children}</div>
)

export const Footer = ({ children }: ChildrenProps) => (
  <div className={classNames(styles.row, styles.footer)}>{children}</div>
)

export const ClearPageMargin = ({
  children,
  className,
  ...rest
}: HTMLProps<HTMLDivElement>) => (
  <div className={classNames(styles.noPageMargin, className)} {...rest}>
    {children}
  </div>
)
