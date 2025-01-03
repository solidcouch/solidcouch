import { useAppSelector } from '@/redux/hooks'
import { selectTheme } from '@/redux/uiSlice'
import { useEffect } from 'react'

/**
 * Read current theme from redux, and update body accordingly
 */
export const useTheme = () => {
  const theme = useAppSelector(selectTheme)

  useEffect(() => {
    globalThis.document.body.setAttribute('data-theme', theme)
  }, [theme])
}
