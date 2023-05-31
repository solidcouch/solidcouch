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
  name: string[]
  about: string[]
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
