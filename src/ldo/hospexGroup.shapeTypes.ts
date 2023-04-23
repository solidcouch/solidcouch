import { ShapeType } from 'ldo'
import { hospexGroupSchema } from './hospexGroup.schema'
import { hospexGroupContext } from './hospexGroup.context'
import { HospexGroup } from './hospexGroup.typings'

/**
 * =============================================================================
 * LDO ShapeTypes hospexGroup
 * =============================================================================
 */

/**
 * HospexGroup ShapeType
 */
export const HospexGroupShapeType: ShapeType<HospexGroup> = {
  schema: hospexGroupSchema,
  shape: 'https://example.com/HospexGroup',
  context: hospexGroupContext,
}
