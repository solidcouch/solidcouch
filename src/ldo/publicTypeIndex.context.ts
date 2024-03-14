import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * publicTypeIndexContext: JSONLD Context for publicTypeIndex
 * =============================================================================
 */
export const publicTypeIndexContext: ContextDefinition = {
  type: {
    '@id': '@type',
  },
  TypeIndex: 'http://www.w3.org/ns/solid/terms#TypeIndex',
  ListedDocument: 'http://www.w3.org/ns/solid/terms#ListedDocument',
  references: {
    '@id': 'http://purl.org/dc/terms/references',
    '@type': '@id',
    '@container': '@set',
  },
  TypeRegistration: 'http://www.w3.org/ns/solid/terms#TypeRegistration',
  forClass: {
    '@id': 'http://www.w3.org/ns/solid/terms#forClass',
    '@type': '@id',
    '@container': '@set',
  },
  instance: {
    '@id': 'http://www.w3.org/ns/solid/terms#instance',
    '@type': '@id',
    '@container': '@set',
  },
  instanceContainer: {
    '@id': 'http://www.w3.org/ns/solid/terms#instanceContainer',
    '@type': '@id',
    '@container': '@set',
  },
}
