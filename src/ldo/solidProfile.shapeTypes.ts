import { ShapeType } from '@ldo/ldo'
import { solidProfileContext } from './solidProfile.context'
import { solidProfileSchema } from './solidProfile.schema'
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
