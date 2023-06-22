import { Loading } from 'components'
import styles from 'components/Interests/Interests.module.scss'
import { communityId } from 'config'
import { useReadInterest, useSearchInterests } from 'hooks/data/useInterests'
import {
  useAddInterest,
  useProfile,
  useRemoveInterest,
} from 'hooks/data/useProfile'
import { debounce, merge } from 'lodash'
import { useCallback, useMemo, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import Select from 'react-select'
import * as types from 'types'
import { URI } from 'types'

export const EditInterests = ({ webId }: { webId: URI }) => {
  const [, queryStatus, , interests] = useProfile(webId, communityId)

  const [query, setQuery] = useState('')

  const { data: options, ...optionsStatus } = useSearchInterests(query)

  const removeInterest = useRemoveInterest()
  const addInterest = useAddInterest()

  const handleRemove = async ({ id, document }: { id: URI; document: URI }) => {
    await removeInterest({ interest: id, document, person: webId })
  }

  const debouncedSetQuery = useMemo(() => debounce(setQuery, 500), [])

  const handleInputChange = useCallback(
    (query: string) => debouncedSetQuery(query),
    [debouncedSetQuery],
  )

  const handleSelect = async (interest: types.Interest | null) => {
    if (interest) {
      await addInterest({
        interest: interest.id,
        person: webId,
        document: webId,
      })
    }
  }

  if (queryStatus.isLoading || queryStatus.isLoading === undefined)
    return <Loading>loading interests</Loading>

  return (
    <div>
      <ul className={styles.list}>
        {interests.map(({ id, document }) => (
          <li key={id + document}>
            <Interest id={id} onRemove={() => handleRemove({ id, document })} />
          </li>
        ))}
      </ul>
      <Select<types.Interest>
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
      />
    </div>
  )
}

const Interest = ({ id, onRemove }: { id: URI; onRemove: () => void }) => {
  const { data } = useReadInterest(id)

  const temporaryData = { id, label: id.split('/').pop(), description: id }

  const thing = merge({}, temporaryData, data)

  return (
    <span title={thing.description} className={styles.item}>
      {thing.label}{' '}
      <button onClick={onRemove}>
        <FaTimes />
      </button>
    </span>
  )
}
