import { ShapeType } from '@ldo/ldo'
import { foafProfileContext } from './foafProfile.context'
import { foafProfileSchema } from './foafProfile.schema'
import { FoafProfile } from './foafProfile.typings'

/**
 * =============================================================================
 * LDO ShapeTypes foafProfile
 * =============================================================================
 */

/**
 * FoafProfile ShapeType
 */
export const FoafProfileShapeType: ShapeType<FoafProfile> = {
  schema: foafProfileSchema,
  shape: 'https://example.com/FoafProfile',
  context: foafProfileContext,
}
