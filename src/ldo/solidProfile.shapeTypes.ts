import { ShapeType } from 'ldo'
import { solidProfileSchema } from './solidProfile.schema'
import { solidProfileContext } from './solidProfile.context'
import { SolidProfile } from './solidProfile.typings'

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
