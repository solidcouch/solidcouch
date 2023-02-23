import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * Typescript Typings for hospexProfile
 * =============================================================================
 */

/**
 * HospexProfile Type
 */
export interface HospexProfile {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'Person'
  }
  note?: string[]
  name?: string
  hasPhoto?: {
    '@id': string
  }
  /**
   * Accommodation that the person offers
   */
  offers?: {
    '@id': string
  }[]
}
