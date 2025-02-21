import { locales } from '@/config'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { actions, selectLocale } from '@/redux/uiSlice'
import styles from './LocaleSelector.module.scss'

export const LocaleSelector = () => {
  const locale = useAppSelector(selectLocale)
  const dispatch = useAppDispatch()

  return (
    <select
      className={styles.select}
      value={locale}
      onChange={e => {
        dispatch(actions.changeLocale(e.target.value))
      }}
    >
      {locales.map(locale => (
        <option key={locale} value={locale}>
          {locale}
        </option>
      ))}
    </select>
  )
}
