import { ShapeType } from '@ldo/ldo'
import { oidcContext } from './oidc.context.ts'
import { oidcSchema } from './oidc.schema.ts'
import { OidcIssuer } from './oidc.typings.ts'

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
  shape: 'https://example.com/OidcIssuer',
  context: oidcContext,
}
