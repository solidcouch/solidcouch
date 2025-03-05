import { LdoJsonldContext, LdSet } from '@ldo/ldo'

/**
 * =============================================================================
 * Typescript Typings for container
 * =============================================================================
 */

/**
 * Container Type
 */
export interface Container {
  '@id'?: string
  '@context'?: LdoJsonldContext
  type: LdSet<
    | {
        '@id': 'Container'
      }
    | {
        '@id': 'BasicContainer'
      }
  >
  contains?: LdSet<Resource | Container>
  modified: string
  mtime: number
  size: number
}

/**
 * Resource Type
 */
export interface Resource {
  '@id'?: string
  '@context'?: LdoJsonldContext
  type: {
    '@id': 'Resource'
  }
  modified: string
  mtime: number
  size: number
}
