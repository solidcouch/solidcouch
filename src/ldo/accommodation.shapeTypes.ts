import { ShapeType } from "@ldo/ldo";
import { accommodationSchema } from "./accommodation.schema";
import { accommodationContext } from "./accommodation.context";
import { Accommodation, Point } from "./accommodation.typings";

/**
 * =============================================================================
 * LDO ShapeTypes accommodation
 * =============================================================================
 */

/**
 * Accommodation ShapeType
 */
export const AccommodationShapeType: ShapeType<Accommodation> = {
  schema: accommodationSchema,
  shape: "https://example.com/Accommodation",
  context: accommodationContext,
};

/**
 * Point ShapeType
 */
export const PointShapeType: ShapeType<Point> = {
  schema: accommodationSchema,
  shape: "https://example.com/Point",
  context: accommodationContext,
};
