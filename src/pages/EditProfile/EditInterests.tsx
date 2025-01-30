import { Loading } from '@/components'
import styles from '@/components/Interests/Interests.module.scss'
import { withToast } from '@/components/withToast.tsx'
import { useConfig } from '@/config/hooks'
import { useReadInterest, useSearchInterests } from '@/hooks/data/useInterests'
import {
  useAddInterest,
  useProfile,
  useRemoveInterest,
} from '@/hooks/data/useProfile'
import type { Interest, URI } from '@/types'
import clsx from 'clsx'
import debounce from 'lodash/debounce'
import merge from 'lodash/merge'
import { useCallback, useMemo, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import Select from 'react-select'

export const EditInterests = ({ webId }: { webId: URI }) => {
  const { communityId } = useConfig()
  const [, isLoading, , interests] = useProfile(webId, communityId)

  const [query, setQuery] = useState('')

  const { data: options, ...optionsStatus } = useSearchInterests(query)

  const removeInterest = useRemoveInterest()
  const addInterest = useAddInterest()

  const handleRemove = async ({ id, document }: { id: URI; document: URI }) => {
    await withToast(removeInterest({ interest: id, document, person: webId }), {
      pending: 'Removing interest',
      success: 'Interest removed',
    })
  }

  const debouncedSetQuery = useMemo(() => debounce(setQuery, 500), [])

  const handleInputChange = useCallback(
    (query: string) => debouncedSetQuery(query),
    [debouncedSetQuery],
  )

  const handleSelect = async (interest: Interest | null) => {
    if (interest) {
      await withToast(
        addInterest({
          interest: interest.id,
          person: webId,
          document: webId,
        }),
        {
          pending: `Adding ${interest.label} to interests`,
          success: `${interest.label} added to interests`,
        },
      )
    }
  }

  if (isLoading || isLoading === undefined)
    return <Loading>loading interests</Loading>

  return (
    <div>
      <ul className={styles.list} data-cy="interests-list-edit">
        {interests.map(({ id, document }) => (
          <li key={id + document}>
            <Interest id={id} onRemove={() => handleRemove({ id, document })} />
          </li>
        ))}
      </ul>
      <Select<Interest>
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
          control: () => styles.control,
          input: () => styles.input,
          menu: () => styles.menu,
          indicatorSeparator: () => styles.separator,
          option: ({ isFocused }) =>
            clsx(styles.option, isFocused && styles.focused),
        }}
      />
    </div>
  )
}

const Interest = ({ id, onRemove }: { id: URI; onRemove: () => void }) => {
  const { data } = useReadInterest(id)

  const temporaryData = { id, label: id.split('/').pop(), description: id }

  const thing = merge({}, temporaryData, data)

  return (
    <span
      title={thing.description}
      className={styles.item}
      data-cy="edit-interest"
    >
      {thing.label}{' '}
      <button onClick={onRemove}>
        <FaTimes />
      </button>
    </span>
  )
}
