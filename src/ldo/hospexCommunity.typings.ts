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
  hasUsergroup: {
    '@id': string
  }[]
}
