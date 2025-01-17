import { ShapeType } from '@ldo/ldo'
import { hospexProfileSchema } from './hospexProfile.schema'
import { hospexProfileContext } from './hospexProfile.context'
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
