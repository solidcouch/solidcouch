import { ShapeType } from '@ldo/ldo'
import { solidProfileContext } from './solidProfile.context.ts'
import { solidProfileSchema } from './solidProfile.schema.ts'
import { SolidProfile } from './solidProfile.typings.ts'

/**
 * =============================================================================
 * LDO ShapeTypes solidProfile
 * =============================================================================
 */

/**
 * SolidProfile ShapeType
 */
export const SolidProfileShapeType: ShapeType<SolidProfile> = {
  schema: solidProfileSchema,
  shape: 'https://example.com/SolidProfile',
  context: solidProfileContext,
}
