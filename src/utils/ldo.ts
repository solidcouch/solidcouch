// stringifying objects with circular reference, according to MDN:

import { LinkedDataObject } from 'ldo'

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

export const ldo2json = <T>(ldo: LinkedDataObject<T>): T =>
  JSON.parse(JSON.stringify(ldo, getCircularReplacer()))
