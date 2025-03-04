import { LanguageString } from '@/types'
import { solid } from '@/utils/rdf-namespaces'
import { LanguageSetMap, LdSet } from '@ldo/jsonld-dataset-proxy'
import { languagesOf, LdoBase, transactionChanges } from '@ldo/ldo'
import { datasetToString } from '@ldo/rdf-utils'
import type { Dataset } from '@rdfjs/types'

/**
 * stringifying objects with circular reference, according to MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value#circular_references
 */
const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (_key: string, value: unknown) => {
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

/**
 * TODO this function could be generalized to accept both LanguageMap and LanguageSetMap[]
 */
export const getLanguages = <K extends string>(
  obj: { [P in K]?: LdSet<string> },
  key: K,
): LanguageString => {
  const languageSetMap = languagesOf(obj, key) as LanguageSetMap
  return transformSetMapToDict(languageSetMap)
}

const transformSetMapToDict = (
  setMap: LanguageSetMap,
): { [langCode: string]: string } => {
  const result: { [langCode: string]: string } = {}

  for (const lang in setMap) {
    result[lang] = [...setMap[lang]!][0]!
  }

  return result
}

export const addLanguagesToLdo = <K extends string>(
  textDict: { [lang: string]: string },
  obj: { [P in K]?: LdSet<string> },
  key: K,
): void => {
  const langs = languagesOf(obj, key) as LanguageSetMap
  if (textDict)
    Object.entries(textDict).forEach(([lang, text]) => {
      langs[lang]?.clear()
      if (text.trim()) langs[lang]?.add(text.trim())
    })
}
