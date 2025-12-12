import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'

export const useLocale = () => useAppSelector(selectLocale)
