import { Dataset } from '@rdfjs/types'
import { transactionChanges } from 'ldo'
import { datasetToString } from 'ldo/dist/datasetConverters'
import { LdoBase } from 'ldo/dist/util'
import N3 from 'n3'
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

export const ldo2json = <T>(ldo: T): T =>
  JSON.parse(JSON.stringify(ldo, getCircularReplacer()))

export const rdf2n3 = (raw: string, baseIRI?: string): Promise<N3.Quad[]> => {
  return new Promise((resolve, reject) => {
    const quads: N3.Quad[] = []
    const parser = new N3.Parser({ baseIRI })
    parser.parse(raw, (error, quad) => {
      if (error) return reject(error)
      if (quad) quads.push(quad)
      else return resolve(quads)
    })
  })
}

export async function toN3Patch(ldo: LdoBase): Promise<string> {
  const changes = transactionChanges(ldo)
  const patch = `
      _:patch a <${solid.InsertDeletePatch}>;
        <${solid.inserts}> { ${
    changes.added
      ? await datasetToString(changes.added as Dataset, { format: 'N3' })
      : ''
  } };
        <${solid.deletes}> { ${
    changes.removed
      ? await datasetToString(changes.removed as Dataset, { format: 'N3' })
      : ''
  } }.`
  return patch
}
