import { ShapeType } from '@ldo/ldo'
import { activityContext } from './activity.context.ts'
import { activitySchema } from './activity.schema.ts'
import { Activity } from './activity.typings.ts'

/**
 * =============================================================================
 * LDO ShapeTypes activity
 * =============================================================================
 */

/**
 * Activity ShapeType
 */
export const ActivityShapeType: ShapeType<Activity> = {
  schema: activitySchema,
  shape: 'https://example.com/Activity',
  context: activityContext,
}
