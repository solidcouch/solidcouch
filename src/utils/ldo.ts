import N3 from 'n3'

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
