import { ShapeType } from '@ldo/ldo'
import { wacContext } from './wac.context.ts'
import { wacSchema } from './wac.schema.ts'
import { Authorization } from './wac.typings.ts'

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
