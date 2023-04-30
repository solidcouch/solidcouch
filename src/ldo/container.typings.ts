import { ContextDefinition } from 'jsonld'

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
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'Container'
      }
    | {
        '@id': 'BasicContainer'
      }
  )[]
  contains?: (Resource | Container)[]
  modified: string
  mtime: number
  size: number
}

/**
 * Resource Type
 */
export interface Resource {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'Resource'
  }
  modified: string
  mtime: number
  size: number
}
