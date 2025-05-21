import { ShapeType } from "@ldo/ldo";
import { oidcSchema } from "./oidc.schema";
import { oidcContext } from "./oidc.context";
import { OidcIssuer } from "./oidc.typings";

/**
 * =============================================================================
 * LDO ShapeTypes oidc
 * =============================================================================
 */

/**
 * OidcIssuer ShapeType
 */
export const OidcIssuerShapeType: ShapeType<OidcIssuer> = {
  schema: oidcSchema,
  shape: "https://example.com/OidcIssuer",
  context: oidcContext,
};
