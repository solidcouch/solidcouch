import { ShapeType } from "@ldo/ldo";
import { activitySchema } from "./activity.schema";
import { activityContext } from "./activity.context";
import { Activity } from "./activity.typings";

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
  shape: "https://example.com/Activity",
  context: activityContext,
};
