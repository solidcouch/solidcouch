import { ShapeType } from "@ldo/ldo";
import { hospexCommunitySchema } from "./hospexCommunity.schema";
import { hospexCommunityContext } from "./hospexCommunity.context";
import { HospexCommunity, HospexGroup } from "./hospexCommunity.typings";

/**
 * =============================================================================
 * LDO ShapeTypes hospexCommunity
 * =============================================================================
 */

/**
 * HospexCommunity ShapeType
 */
export const HospexCommunityShapeType: ShapeType<HospexCommunity> = {
  schema: hospexCommunitySchema,
  shape: "https://example.com/HospexCommunity",
  context: hospexCommunityContext,
};

/**
 * HospexGroup ShapeType
 */
export const HospexGroupShapeType: ShapeType<HospexGroup> = {
  schema: hospexCommunitySchema,
  shape: "https://example.com/HospexGroup",
  context: hospexCommunityContext,
};
