import { Loading } from '@/components'
import { Interest } from '@/components/Interests/Interest'
import styles from '@/components/Interests/Interests.module.scss'
import { withToast } from '@/components/withToast.tsx'
import { useConfig } from '@/config/hooks'
import { useSearchInterests } from '@/hooks/data/useInterests'
import {
  useAddInterest,
  useProfile,
  useRemoveInterest,
} from '@/hooks/data/useProfile'
import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'
import type { Interest as InterestData, URI } from '@/types'
import { Trans, useLingui } from '@lingui/react/macro'
import clsx from 'clsx'
import debounce from 'lodash/debounce'
import { useCallback, useMemo, useState } from 'react'
import Select from 'react-select'

export const EditInterests = ({ webId }: { webId: URI }) => {
  const { t } = useLingui()
  const locale = useAppSelector(selectLocale)
  const { communityId } = useConfig()
  const [, isLoading, , interests] = useProfile(webId, communityId)

  const [query, setQuery] = useState('')

  const { data: options, ...optionsStatus } = useSearchInterests(query, locale)

  const removeInterest = useRemoveInterest()
  const addInterest = useAddInterest()

  const handleRemove = async ({ id, document }: { id: URI; document: URI }) => {
    await withToast(removeInterest({ interest: id, document, person: webId }), {
      pending: t`Removing interest`,
      success: t`Interest removed`,
    })
  }

  const debouncedSetQuery = useMemo(() => debounce(setQuery, 500), [])

  const handleInputChange = useCallback(
    (query: string) => debouncedSetQuery(query),
    [debouncedSetQuery],
  )

  const handleSelect = async (interest: InterestData | null) => {
    if (interest) {
      const label = interest.label
      await withToast(
        addInterest({
          interest: interest.uri,
          person: webId,
          document: webId,
        }),
        {
          pending: t`Adding ${label} to interests`,
          success: t`${label} added to interests`,
        },
      )
    }
  }

  if (isLoading || isLoading === undefined)
    return (
      <Loading>
        <Trans>loading interests...</Trans>
      </Loading>
    )

  return (
    <div>
      <ul className={styles.list} data-cy="interests-list-edit">
        {interests.map(({ id, document }) => (
          <li key={id + document}>
            <Interest
              uri={id}
              onRemove={() => handleRemove({ id, document })}
              locale={locale}
              data-cy="edit-interest"
            />
          </li>
        ))}
      </ul>
      <Select<InterestData>
        options={options}
        // show all results that were found
        filterOption={() => true}
        formatOptionLabel={interest => (
          <div title={interest.description}>
            {interest.label}
            {interest.aliases.length > 0 && ` (${interest.aliases.join(', ')})`}
            <br />
            {interest.description}
          </div>
        )}
        isLoading={optionsStatus.isFetching}
        // don't keep the selected thing
        value={null}
        menuPlacement="auto"
        placeholder="Search interest..."
        onInputChange={handleInputChange}
        onChange={handleSelect}
        className={clsx(styles.select, 'cy-select-interests')}
        classNames={{
          control: () => styles.control ?? '',
          input: () => styles.input ?? '',
          menu: () => styles.menu ?? '',
          indicatorSeparator: () => styles.separator ?? '',
          option: ({ isFocused }) =>
            clsx(styles.option, isFocused && styles.focused),
        }}
      />
    </div>
  )
}
