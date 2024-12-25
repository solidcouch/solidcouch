import { ShapeType } from '@ldo/ldo'
import { oidcContext } from './oidc.context'
import { oidcSchema } from './oidc.schema'
import { OidcIssuer } from './oidc.typings'

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
