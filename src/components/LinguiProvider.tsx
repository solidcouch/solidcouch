import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { actions, selectLocale } from '@/redux/uiSlice'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode, useEffect } from 'react'

export const LinguiProvider = ({ children }: { children: ReactNode }) => {
  const locale = useAppSelector(selectLocale)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (locale) dynamicActivate(locale)
    else dispatch(actions.changeLocale())
  }, [dispatch, locale])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}

/**
 * We do a dynamic import of just the catalog that we need
 * @param locale any locale string
 */
async function dynamicActivate(locale: string) {
  const { messages } = await import(`../locales/${locale}.ts`)
  i18n.load(locale, messages)
  i18n.activate(locale)
}
