import { ContextDefinition } from 'jsonld'

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
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'Community'
      }
    | {
        '@id': 'Community2'
      }
  )[]
  /**
   * Name of the community. One name per language.
   */
  name: string[]
  about: string[]
  /**
   * A teaser, tagline, pun for the community
   */
  note?: string[]
  /**
   * Logo of the community. If two are specified, the second one may be used for highlight of the first one
   */
  logo?: {
    '@id': string
  }[]
  homepage?: {
    '@id': string
  }
  inbox?: {
    '@id': string
  }
  hasUsergroup: HospexGroup[]
}

/**
 * HospexGroup Type
 */
export interface HospexGroup {
  '@id'?: string
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'Group'
      }
    | {
        '@id': 'Usergroup'
      }
  )[]
  usergroupOf: {
    '@id': string
  }
  hasMember?: {
    '@id': string
  }[]
}
