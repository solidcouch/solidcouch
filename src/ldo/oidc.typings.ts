import { LdoJsonldContext, LdSet } from '@ldo/ldo'

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
  '@context'?: LdoJsonldContext
  /**
   * Solid OIDC issuer for a webId.
   */
  oidcIssuer: LdSet<{
    '@id': string
  }>
}
