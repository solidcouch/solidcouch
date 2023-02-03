import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * Typescript Typings for oidc
 * =============================================================================
 */

/**
 * OidcIssuer Type
 */
export interface OidcIssuer {
  '@id'?: string
  '@context'?: ContextDefinition
  /**
   * Solid OIDC issuer for a webId.
   */
  oidcIssuer: {
    '@id': string
  }[]
}
