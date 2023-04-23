import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * Typescript Typings for accommodation
 * =============================================================================
 */

/**
 * Accommodation Type
 */
export interface Accommodation {
  '@id'?: string
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'Accommodation'
      }
    | {
        '@id': 'Accommodation2'
      }
  )[]
  /**
   * Text about the accommodation
   */
  description?: string[]
  /**
   * Location of the accommodation
   */
  location: Point
  offeredBy: {
    '@id': string
  }
}

/**
 * Point Type
 */
export interface Point {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'Point'
  }
  /**
   * Latitude of the location in WGS84
   */
  lat: number
  /**
   * Longitude of the location in WGS84
   */
  long: number
}
