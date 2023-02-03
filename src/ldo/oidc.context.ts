import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * oidcContext: JSONLD Context for oidc
 * =============================================================================
 */
export const oidcContext: ContextDefinition = {
  oidcIssuer: {
    '@id': 'http://www.w3.org/ns/solid/terms#oidcIssuer',
    '@type': '@id',
    '@container': '@set',
  },
}
