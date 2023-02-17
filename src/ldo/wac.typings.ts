import { ContextDefinition } from 'jsonld'

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
  '@context'?: ContextDefinition
  type: {
    '@id': 'Authorization'
  }
  accessTo: {
    '@id': string
  }[]
  default?: {
    '@id': string
  }
  agent?: {
    '@id': string
  }[]
  agentClass?: {
    '@id': string
  }[]
  agentGroup?: {
    '@id': string
  }[]
  mode: {
    '@id': string
  }[]
  origin?: {
    '@id': string
  }[]
}
