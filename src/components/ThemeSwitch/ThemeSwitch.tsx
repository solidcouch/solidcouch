import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import * as uiSlice from '@/redux/uiSlice'
import { selectTheme } from '@/redux/uiSlice'
import { useLingui } from '@lingui/react/macro'
import { FaMoon, FaSun } from 'react-icons/fa'
import styles from './ThemeSwitch.module.scss'

export const ThemeSwitch = () => {
  const theme = useAppSelector(selectTheme)
  const dispatch = useAppDispatch()
  const { t } = useLingui()
  const handleToggleTheme = () => {
    dispatch(uiSlice.actions.toggleTheme())
  }

  return (
    <button
      className={styles.switch}
      onClick={handleToggleTheme}
      aria-label={
        theme === 'dark' ? t`Switch to light theme` : t`Switch to dark theme`
      }
    >
      {theme === 'dark' ? <FaSun /> : <FaMoon />}
    </button>
  )
}
