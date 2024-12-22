import { ShapeType } from '@ldo/ldo'
import { foafProfileContext } from './foafProfile.context.ts'
import { foafProfileSchema } from './foafProfile.schema.ts'
import { FoafProfile } from './foafProfile.typings.ts'

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
