import { URI } from '@/types'
import { getContainer, getParentContainer } from '@/utils/helpers'
import { space } from '@/utils/rdf-namespaces'
import { minBy } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useSolidProfile } from './useProfile'
import { useRdfDocuments } from './useRdfDocument'

export const useStorage = (me: URI) => {
  const [profile, queryStatus] = useSolidProfile(me)
  const [rootStorage] = useRootStorage(me)
  const storages = profile?.storage?.map(s => s['@id']) ?? []
  if (queryStatus.isFetched) return storages[0] ?? rootStorage
}

const useRootStorage = (me: URI) => {
  const [resources, setResources] = useState<URI[]>([getContainer(me)])
  const [storage, setStorage] = useState<URI>()
  const results = useRdfDocuments(resources)
  const outcomes = useMemo(
    () => results.map(res => res.data?.response?.headers.get('Link')),
    [results],
  )

  useEffect(() => {
    const storageIndex = outcomes.findIndex(outcome =>
      outcome?.includes(space.Storage),
    )
    if (storageIndex > -1) {
      setStorage(resources[storageIndex])
    } else if (results.every(r => r.isSuccess || r.isError)) {
      setResources(state => {
        // get shortest of the resources and get its parent if available
        const shortest = minBy(state, str => str.length)
        if (shortest) {
          const parent = getParentContainer(shortest)
          if (!state.includes(parent)) return [...state, parent]
        }
        return state
      })
    }
  }, [outcomes, resources, results])

  const inProgress =
    !results.every(r => r.isSuccess || r.isError) ||
    results.length < resources.length

  return [storage, inProgress]
}
