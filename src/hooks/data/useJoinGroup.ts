import { useCallback } from 'react'
import { URI } from '../../types/index.ts'
import { solid, vcard } from '../../utils/rdf-namespaces.ts'
import { useUpdateRdfDocument } from './useRdfDocument.ts'

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
