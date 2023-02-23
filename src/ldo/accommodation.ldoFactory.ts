import { LdoFactory } from 'ldo'
import {
  AccommodationShapeType,
  PointShapeType,
} from './accommodation.shapeTypes'

/**
 * =============================================================================
 * LDO Factories for accommodation
 * =============================================================================
 */

/**
 * Accommodation LdoFactory
 */
export const AccommodationFactory = new LdoFactory(AccommodationShapeType)

/**
 * Point LdoFactory
 */
export const PointFactory = new LdoFactory(PointShapeType)
