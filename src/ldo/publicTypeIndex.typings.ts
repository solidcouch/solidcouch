import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * Typescript Typings for publicTypeIndex
 * =============================================================================
 */

/**
 * PublicTypeIndex Type
 */
export interface PublicTypeIndex {
  '@id'?: string
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'TypeIndex'
      }
    | {
        '@id': 'ListedDocument'
      }
  )[]
  references?: TypeRegistration[]
}

/**
 * TypeRegistration Type
 */
export interface TypeRegistration {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'TypeRegistration'
  }
  forClass: {
    '@id': string
  }[]
  instance?: {
    '@id': string
  }[]
  instanceContainer?: {
    '@id': string
  }[]
}
