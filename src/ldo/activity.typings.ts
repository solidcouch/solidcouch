import { LdoJsonldContext } from '@ldo/ldo'

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
  '@context'?: LdoJsonldContext
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
