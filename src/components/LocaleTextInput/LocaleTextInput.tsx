import { useConfig } from '@/config/hooks'
import { LanguageString } from '@/types'
import { preferentialSort } from '@/utils/helpers'
import { ajvResolver } from '@hookform/resolvers/ajv'
import { Trans, useLingui } from '@lingui/react/macro'
import { JSONSchemaType } from 'ajv'
import clsx from 'clsx'
import { Dialog, Tabs, ToggleGroup } from 'radix-ui'
import { ComponentProps, useEffect, useMemo, useState } from 'react'
import { Controller, Noop, RefCallBack, useForm } from 'react-hook-form'
import { Button } from '../Button/Button'
import tabStyles from '../LocaleText/LocaleText.module.scss'
import styles from './LocaleTextInput.module.scss'

interface LocaleTextInputProps {
  name: string
  locale: string
  value: LanguageString
  onChange: (value: LanguageString) => void
  ref?: RefCallBack
  onBlur?: Noop
  initialData?: LanguageString
}

export const LocaleTextInput = ({
  name,
  locale,
  value,
  onChange,
  onBlur,
  ref,
  initialData,
  className,
  ...rest
}: Omit<ComponentProps<'textarea'>, 'value'> & LocaleTextInputProps) => {
  const locales = useMemo(
    () =>
      [...new Set([...Object.keys(value), locale])].sort(
        preferentialSort([locale]),
      ),
    [locale, value],
  )

  const [selectedLocale, setSelectedLocale] = useState(locale)

  // Ensure the locale has an empty string if undefined
  useEffect(() => {
    if (value?.[selectedLocale] === undefined) {
      onChange({
        [selectedLocale]: '',
        ...value,
      })
    }
  }, [onChange, selectedLocale, value])

  return (
    <Tabs.Root value={selectedLocale} onValueChange={setSelectedLocale}>
      <Tabs.List className={tabStyles.list}>
        {locales.map(loc => (
          <Tabs.Trigger
            key={loc}
            value={loc}
            className={clsx(tabStyles.trigger, {
              [tabStyles.edited!]: initialData?.[loc]
                ? value[loc] !== initialData[loc]
                : value[loc],
              [tabStyles.empty!]: !value[loc],
            })}
          >
            {loc}
          </Tabs.Trigger>
        ))}
        <AddLanguage
          className={tabStyles.trigger}
          onConfirm={lang => {
            if (lang && !locales.includes(lang))
              onChange({
                [lang]: '',
                ...value,
              })
            if (lang) setSelectedLocale(lang)
          }}
        />
      </Tabs.List>
      {locales.map(loc => (
        <Tabs.Content key={loc} value={loc}>
          <textarea
            name={`${name}.${loc}`}
            value={value[loc]}
            onChange={e => {
              onChange({
                ...value,
                [loc]: e.target.value,
              })
            }}
            className={clsx(styles.input, className)}
            onBlur={onBlur}
            ref={ref}
            {...rest}
          />
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}

const localeValidationSchema: JSONSchemaType<{ locale: string }> = {
  type: 'object',
  required: ['locale'],
  properties: {
    locale: {
      type: 'string',
      minLength: 2,
      pattern: '^[a-z]{2}(?:-[A-Z]{2})?$',
    },
  },
}

const AddLanguage = ({
  onConfirm,
  ...rest
}: { onConfirm: (lang?: string) => void } & ComponentProps<'button'>) => {
  const { locales } = useConfig()
  const { t } = useLingui()
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, control, watch, formState } = useForm<{
    locale: string
  }>({
    resolver: ajvResolver(localeValidationSchema),
  })

  const handleFormSubmit = handleSubmit(({ locale }, event) => {
    event?.stopPropagation()
    onConfirm(locale)
    setOpen(false)
    return false
  })

  const locale = watch('locale')

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" {...rest}>
          +
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content className={styles.dialogContent}>
          <Dialog.Title className={styles.dialogTitle}>
            <Trans>Add a language</Trans>
          </Dialog.Title>
          {/* TODO revisit: Removed form because it was triggering the form below */}
          {/* <form onSubmit={handleFormSubmit} id="locale-form"> */}
          <Controller
            control={control}
            name="locale"
            render={({ field }) => (
              <ToggleGroup.Root
                type="single"
                value={field.value}
                onValueChange={field.onChange}
                className={styles.localeToggleGroup}
              >
                {locales.map(loc => (
                  <ToggleGroup.Item
                    key={loc}
                    value={loc}
                    className={styles.item}
                  >
                    {loc}
                  </ToggleGroup.Item>
                ))}
                <input
                  type="text"
                  size={2}
                  placeholder={t`code`}
                  {...register('locale')}
                />
              </ToggleGroup.Root>
            )}
          />
          <div className={styles.controls}>
            <Dialog.Close asChild>
              <Button tertiary>
                <Trans>Cancel</Trans>
              </Button>
            </Dialog.Close>
            <Button
              primary
              onClick={handleFormSubmit}
              disabled={!formState.isValid}
            >
              <Trans>Add {locale}</Trans>
            </Button>
          </div>
          {/* </form> */}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
