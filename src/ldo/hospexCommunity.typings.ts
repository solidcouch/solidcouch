import { LdoJsonldContext, LdSet } from '@ldo/ldo'

/**
 * =============================================================================
 * Typescript Typings for hospexCommunity
 * =============================================================================
 */

/**
 * HospexCommunity Type
 */
export interface HospexCommunity {
  '@id'?: string
  '@context'?: LdoJsonldContext
  type: LdSet<
    | {
        '@id': 'Community'
      }
    | {
        '@id': 'Community2'
      }
  >
  /**
   * Name of the community. One name per language.
   */
  name: LdSet<string>
  about: LdSet<string>
  /**
   * A teaser, tagline, pun for the community
   */
  note?: LdSet<string>
  /**
   * Logo of the community. If two are specified, the second one may be used for highlight of the first one
   */
  logo?: LdSet<{
    '@id': string
  }>
  homepage?: {
    '@id': string
  }
  inbox?: {
    '@id': string
  }
  hasUsergroup: LdSet<HospexGroup>
}

/**
 * HospexGroup Type
 */
export interface HospexGroup {
  '@id'?: string
  '@context'?: LdoJsonldContext
  type: LdSet<
    | {
        '@id': 'Group'
      }
    | {
        '@id': 'Usergroup'
      }
  >
  usergroupOf: {
    '@id': string
  }
  hasMember?: LdSet<{
    '@id': string
  }>
}
