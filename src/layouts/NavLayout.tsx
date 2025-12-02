import { ReactNode } from 'react'
import { NavLink } from 'react-router'
import styles from './NavLayout.module.scss'

export const NavLayout = ({
  tabs,
  children,
}: {
  tabs: { link: string; label: ReactNode }[]
  children: ReactNode
}) => {
  return (
    <div className={styles.container}>
      {children}
      <nav className={styles.navigation}>
        {tabs.map(({ link, label }) => (
          <NavLink
            key={link}
            className={({ isActive }) => (isActive ? styles.active : undefined)}
            to={link}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
