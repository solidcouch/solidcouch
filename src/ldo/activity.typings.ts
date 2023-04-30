import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * Typescript Typings for activity
 * =============================================================================
 */

/**
 * Activity Type
 */
export interface Activity {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'Add'
  }
  actor: {
    '@id': string
  }
  context: {
    '@id': string
  }
  object: {
    '@id': string
  }
  target: {
    '@id': string
  }
  updated: string
}
