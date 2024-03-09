import { LdoBase, transactionChanges } from '@ldo/ldo'
import { datasetToString } from '@ldo/rdf-utils'
import { Dataset } from '@rdfjs/types'
import { solid } from 'utils/rdf-namespaces'

// stringifying objects with circular reference, according to MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value#circular_references
const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (key: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}

/**
 * Stringify LDO
 * useful for logging
 */
// eslint-disable-next-line import/no-unused-modules
export const ldo2json = <T>(ldo: T): T =>
  JSON.parse(JSON.stringify(ldo, getCircularReplacer()))

export async function toN3Patch(ldo: LdoBase): Promise<string> {
  const changes = transactionChanges(ldo)
  const parts = [`_:mutate a <${solid.InsertDeletePatch}>`]
  if (changes.added) {
    const inserts = await datasetToString(changes.added as Dataset, {
      format: 'N3',
    })
    parts.push(`<${solid.inserts}> { ${inserts} }`)
  }

  if (changes.removed) {
    const deletes = await datasetToString(changes.removed as Dataset, {
      format: 'N3',
    })
    parts.push(`<${solid.deletes}> { ${deletes} }`)
  }
  const patch = parts.join(';\n') + '.'

  return patch
}
