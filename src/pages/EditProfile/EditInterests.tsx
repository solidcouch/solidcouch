import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { interestApi } from 'app/services/interestApi'
import { Loading } from 'components'
import styles from 'components/Interests/Interests.module.scss'
import { debounce, merge } from 'lodash'
import { useCallback, useMemo, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import Select from 'react-select'
import * as types from 'types'
import { URI } from 'types'

export const EditInterests = ({ webId }: { webId: URI }) => {
  const { data: interests } =
    comunicaApi.endpoints.readInterestsWithDocuments.useQuery({ person: webId })

  const [query, setQuery] = useState('')

  const { data: options, ...optionsStatus } =
    interestApi.endpoints.searchInterests.useQuery(
      query ? { query } : skipToken,
    )

  const [removeInterest] = comunicaApi.endpoints.removeInterest.useMutation()
  const [addInterest] = comunicaApi.endpoints.addInterest.useMutation()

  const handleRemove = async ({ id, document }: { id: URI; document: URI }) => {
    await removeInterest({ id, document, person: webId }).unwrap()
  }

  const debouncedSetQuery = useMemo(() => debounce(setQuery, 500), [])

  const handleInputChange = useCallback(
    (query: string) => debouncedSetQuery(query),
    [debouncedSetQuery],
  )

  const handleSelect = async (interest: types.Interest | null) => {
    if (interest) {
      await addInterest({ id: interest.id, person: webId })
    }
  }

  if (!interests) return <Loading>loading interests</Loading>

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
        formatOptionLabel={interest => (
          <div title={interest.description}>
            {interest.label}
            <br />
            {interest.description}
          </div>
        )}
        onInputChange={handleInputChange}
        onChange={handleSelect}
        menuPlacement="auto"
        value={null}
        placeholder="Search interest..."
        isLoading={optionsStatus.isFetching}
      />
    </div>
  )
}

const Interest = ({ id, onRemove }: { id: URI; onRemove: () => void }) => {
  const { data } = interestApi.endpoints.readInterest.useQuery({ id })

  const temporaryData = {
    id,
    label: id.split('/').pop(),
    description: id,
  }

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
