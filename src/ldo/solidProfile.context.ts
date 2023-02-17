import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * solidProfileContext: JSONLD Context for solidProfile
 * =============================================================================
 */
export const solidProfileContext: ContextDefinition = {
  type: {
    '@id': '@type',
  },
  Person: 'http://xmlns.com/foaf/0.1/Person',
  inbox: {
    '@id': 'http://www.w3.org/ns/ldp#inbox',
    '@type': '@id',
  },
  preferencesFile: {
    '@id': 'http://www.w3.org/ns/pim/space#preferencesFile',
    '@type': '@id',
  },
  storage: {
    '@id': 'http://www.w3.org/ns/pim/space#storage',
    '@type': '@id',
    '@container': '@set',
  },
  account: {
    '@id': 'http://www.w3.org/ns/solid/terms#account',
    '@type': '@id',
  },
  privateTypeIndex: {
    '@id': 'http://www.w3.org/ns/solid/terms#privateTypeIndex',
    '@type': '@id',
    '@container': '@set',
  },
  publicTypeIndex: {
    '@id': 'http://www.w3.org/ns/solid/terms#publicTypeIndex',
    '@type': '@id',
    '@container': '@set',
  },
}
