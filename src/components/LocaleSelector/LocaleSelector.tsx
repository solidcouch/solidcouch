import { locales } from '@/config'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { actions, selectLocale } from '@/redux/uiSlice'

export const LocaleSelector = () => {
  const locale = useAppSelector(selectLocale)
  const dispatch = useAppDispatch()

  return (
    <select
      value={locale}
      onChange={e => {
        dispatch(actions.changeLocale(e.target.value))
      }}
    >
      {locales.map(locale => (
        <option value={locale}>{locale}</option>
      ))}
    </select>
  )
}
