import { useCallback } from 'react'
import { URI } from 'types'
import { solid, vcard } from '../../utils/rdf-namespaces'
import { useUpdateRdfDocument } from './useRdfDocument'

export const useJoinGroup = () => {
  const updateMutation = useUpdateRdfDocument()
  return useCallback(
    async ({ person, group }: { person: URI; group: URI }) => {
      const patch = `_:mutate a <${solid.InsertDeletePatch}>;
        <${solid.inserts}> { <${group}> <${vcard.hasMember}> <${person}>. } .`
      await updateMutation.mutateAsync({
        uri: group,
        patch,
      })
    },
    [updateMutation],
  )
}
