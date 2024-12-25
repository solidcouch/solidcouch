import { ShapeType } from '@ldo/ldo'
import { hospexProfileContext } from './hospexProfile.context'
import { hospexProfileSchema } from './hospexProfile.schema'
import { HospexProfile } from './hospexProfile.typings'

/**
 * =============================================================================
 * LDO ShapeTypes hospexProfile
 * =============================================================================
 */

/**
 * HospexProfile ShapeType
 */
export const HospexProfileShapeType: ShapeType<HospexProfile> = {
  schema: hospexProfileSchema,
  shape: 'https://example.com/HospexProfile',
  context: hospexProfileContext,
}
