import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import * as uiSlice from '@/redux/uiSlice'
import { selectTheme } from '@/redux/uiSlice'
import { FaMoon, FaSun } from 'react-icons/fa'

export const ThemeSwitch = () => {
  const theme = useAppSelector(selectTheme)
  const dispatch = useAppDispatch()
  const handleToggleTheme = () => {
    dispatch(uiSlice.actions.toggleTheme())
  }

  return (
    <button
      onClick={handleToggleTheme}
      aria-label={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
    >
      {theme === 'dark' ? <FaMoon /> : <FaSun />}
    </button>
  )
}
