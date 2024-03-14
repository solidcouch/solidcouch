import { ShapeType } from '@ldo/ldo'
import { wacSchema } from './wac.schema'
import { wacContext } from './wac.context'
import { Authorization } from './wac.typings'

/**
 * =============================================================================
 * LDO ShapeTypes wac
 * =============================================================================
 */

/**
 * Authorization ShapeType
 */
export const AuthorizationShapeType: ShapeType<Authorization> = {
  schema: wacSchema,
  shape: 'https://example.com/Authorization',
  context: wacContext,
}
