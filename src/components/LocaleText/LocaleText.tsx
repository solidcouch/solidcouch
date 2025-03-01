import { LanguageString } from '@/types'
import { preferentialSort } from '@/utils/helpers'
import { Tabs } from 'radix-ui'
import {
  ComponentProps,
  ElementType,
  useEffect,
  useMemo,
  useState,
} from 'react'
import styles from './LocaleText.module.scss'

export const LocaleText = <C extends ElementType = 'section'>({
  text,
  locale,
  as: Component = 'section',
  ...rest
}: {
  text: LanguageString
  locale: string
  as?: C
} & ComponentProps<C>) => {
  const locales = useMemo(
    () =>
      Object.keys(text)
        // show only locales with non-empty text
        .filter(lang => typeof text[lang] === 'string' && text[lang].trim())
        .sort(preferentialSort([locale])),
    [locale, text],
  )
  const [selectedLocale, setSelectedLocale] = useState(
    // eslint-disable-next-line lingui/no-unlocalized-strings
    locales[0] ?? 'en',
  )
  useEffect(() => {
    if (locales.includes(locale)) setSelectedLocale(locale)
  }, [locale, locales])

  return (
    <Tabs.Root asChild value={selectedLocale} onValueChange={setSelectedLocale}>
      <Component {...rest}>
        <Tabs.List className={styles.list}>
          {locales.map(lang => (
            <Tabs.Trigger key={lang} value={lang} className={styles.trigger}>
              {lang}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {locales.map(lang => (
          <Tabs.Content key={lang} value={lang}>
            {text[lang]}
          </Tabs.Content>
        ))}
      </Component>
    </Tabs.Root>
  )
}
