import { LdoFactory } from 'ldo'
import {
  PublicTypeIndexShapeType,
  TypeRegistrationShapeType,
} from './publicTypeIndex.shapeTypes'

/**
 * =============================================================================
 * LDO Factories for publicTypeIndex
 * =============================================================================
 */

/**
 * PublicTypeIndex LdoFactory
 */
export const PublicTypeIndexFactory = new LdoFactory(PublicTypeIndexShapeType)

/**
 * TypeRegistration LdoFactory
 */
export const TypeRegistrationFactory = new LdoFactory(TypeRegistrationShapeType)
