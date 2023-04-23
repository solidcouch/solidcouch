import { ShapeType } from 'ldo'
import { hospexCommunitySchema } from './hospexCommunity.schema'
import { hospexCommunityContext } from './hospexCommunity.context'
import { HospexCommunity } from './hospexCommunity.typings'

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
