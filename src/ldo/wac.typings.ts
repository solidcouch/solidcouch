import { LdoJsonldContext, LdSet } from '@ldo/ldo'

/**
 * =============================================================================
 * Typescript Typings for wac
 * =============================================================================
 */

/**
 * Authorization Type
 */
export interface Authorization {
  '@id'?: string
  '@context'?: LdoJsonldContext
  type: {
    '@id': 'Authorization'
  }
  accessTo: LdSet<{
    '@id': string
  }>
  default?: {
    '@id': string
  }
  agent?: LdSet<{
    '@id': string
  }>
  agentClass?: LdSet<{
    '@id': string
  }>
  agentGroup?: LdSet<{
    '@id': string
  }>
  mode?: LdSet<
    | {
        '@id': string
      }
    | {
        '@id': 'Read'
      }
    | {
        '@id': 'Write'
      }
    | {
        '@id': 'Control'
      }
    | {
        '@id': 'Append'
      }
  >
  origin?: LdSet<{
    '@id': string
  }>
}
