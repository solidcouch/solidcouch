import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * Typescript Typings for hospexGroup
 * =============================================================================
 */

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
