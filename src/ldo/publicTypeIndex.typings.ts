import { LdoJsonldContext, LdSet } from '@ldo/ldo'

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
  '@context'?: LdoJsonldContext
  type: LdSet<
    | {
        '@id': 'TypeIndex'
      }
    | {
        '@id': 'ListedDocument'
      }
  >
}

/**
 * TypeRegistration Type
 */
export interface TypeRegistration {
  '@id'?: string
  '@context'?: LdoJsonldContext
  type: {
    '@id': 'TypeRegistration'
  }
  forClass: LdSet<{
    '@id': string
  }>
  instance?: LdSet<{
    '@id': string
  }>
  instanceContainer?: LdSet<{
    '@id': string
  }>
}
