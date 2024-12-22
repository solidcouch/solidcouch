import { ShapeType } from '@ldo/ldo'
import { hospexCommunityContext } from './hospexCommunity.context.ts'
import { hospexCommunitySchema } from './hospexCommunity.schema.ts'
import { HospexCommunity, HospexGroup } from './hospexCommunity.typings.ts'

/**
 * =============================================================================
 * LDO ShapeTypes hospexCommunity
 * =============================================================================
 */

/**
 * HospexCommunity ShapeType
 */
export const HospexCommunityShapeType: ShapeType<HospexCommunity> = {
  schema: hospexCommunitySchema,
  shape: 'https://example.com/HospexCommunity',
  context: hospexCommunityContext,
}

/**
 * HospexGroup ShapeType
 */
export const HospexGroupShapeType: ShapeType<HospexGroup> = {
  schema: hospexCommunitySchema,
  shape: 'https://example.com/HospexGroup',
  context: hospexCommunityContext,
}
