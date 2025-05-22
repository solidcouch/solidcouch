import { ShapeType } from "@ldo/ldo";
import { publicTypeIndexSchema } from "./publicTypeIndex.schema";
import { publicTypeIndexContext } from "./publicTypeIndex.context";
import { PublicTypeIndex, TypeRegistration } from "./publicTypeIndex.typings";

/**
 * =============================================================================
 * LDO ShapeTypes publicTypeIndex
 * =============================================================================
 */

/**
 * PublicTypeIndex ShapeType
 */
export const PublicTypeIndexShapeType: ShapeType<PublicTypeIndex> = {
  schema: publicTypeIndexSchema,
  shape: "https://example.com/PublicTypeIndex",
  context: publicTypeIndexContext,
};

/**
 * TypeRegistration ShapeType
 */
export const TypeRegistrationShapeType: ShapeType<TypeRegistration> = {
  schema: publicTypeIndexSchema,
  shape: "https://example.com/TypeRegistration",
  context: publicTypeIndexContext,
};
