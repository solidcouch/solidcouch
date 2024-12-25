import { ShapeType } from '@ldo/ldo'
import { hospexProfileContext } from './hospexProfile.context.ts'
import { hospexProfileSchema } from './hospexProfile.schema.ts'
import { HospexProfile } from './hospexProfile.typings.ts'

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
