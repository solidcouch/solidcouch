// inspired by https://stackoverflow.com/a/24979148

import clsx from 'clsx'
import { ReactNode } from 'react'
import styles from './Layout.module.scss'

interface ChildrenProps {
  children?: ReactNode
}

export const Layout = ({
  children,
  page,
}: ChildrenProps & { page?: boolean }) => {
  return <div className={clsx(styles.box, page && styles.page)}>{children}</div>
}

export const Header = ({ children }: ChildrenProps) => (
  <div className={clsx(styles.row, styles.header)}>{children}</div>
)

export const Content = ({ children }: ChildrenProps) => (
  <div className={clsx(styles.row, styles.content)}>{children}</div>
)

/**
 * TODO use or remove these
 */
// export const Footer = ({ children }: ChildrenProps) => (
//   <div className={clsx(styles.row, styles.footer)}>{children}</div>
// )
//
// export const ClearPageMargin = ({
//   children,
//   className,
//   ...rest
// }: HTMLProps<HTMLDivElement>) => (
//   <div className={clsx(styles.noPageMargin, className)} {...rest}>
//     {children}
//   </div>
// )
