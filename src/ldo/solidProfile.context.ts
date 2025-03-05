import { LdoJsonldContext } from '@ldo/ldo'

/**
 * =============================================================================
 * solidProfileContext: JSONLD Context for solidProfile
 * =============================================================================
 */
export const solidProfileContext: LdoJsonldContext = {
  type: {
    '@id': '@type',
  },
  Person: {
    '@id': 'http://xmlns.com/foaf/0.1/Person',
    '@context': {
      type: {
        '@id': '@type',
      },
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
        '@isCollection': true,
      },
      account: {
        '@id': 'http://www.w3.org/ns/solid/terms#account',
        '@type': '@id',
      },
      privateTypeIndex: {
        '@id': 'http://www.w3.org/ns/solid/terms#privateTypeIndex',
        '@type': '@id',
        '@isCollection': true,
      },
      publicTypeIndex: {
        '@id': 'http://www.w3.org/ns/solid/terms#publicTypeIndex',
        '@type': '@id',
        '@isCollection': true,
      },
    },
  },
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
    '@isCollection': true,
  },
  account: {
    '@id': 'http://www.w3.org/ns/solid/terms#account',
    '@type': '@id',
  },
  privateTypeIndex: {
    '@id': 'http://www.w3.org/ns/solid/terms#privateTypeIndex',
    '@type': '@id',
    '@isCollection': true,
  },
  publicTypeIndex: {
    '@id': 'http://www.w3.org/ns/solid/terms#publicTypeIndex',
    '@type': '@id',
    '@isCollection': true,
  },
}
