import { LdoFactory } from 'ldo'
import { OidcIssuerShapeType } from './oidc.shapeTypes'

/**
 * =============================================================================
 * LDO Factories for oidc
 * =============================================================================
 */

/**
 * OidcIssuer LdoFactory
 */
export const OidcIssuerFactory = new LdoFactory(OidcIssuerShapeType)
