import { ShapeType } from '@ldo/ldo'
import { publicTypeIndexContext } from './publicTypeIndex.context.ts'
import { publicTypeIndexSchema } from './publicTypeIndex.schema.ts'
import { PublicTypeIndex, TypeRegistration } from './publicTypeIndex.typings.ts'

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
  shape: 'https://example.com/PublicTypeIndex',
  context: publicTypeIndexContext,
}

/**
 * TypeRegistration ShapeType
 */
export const TypeRegistrationShapeType: ShapeType<TypeRegistration> = {
  schema: publicTypeIndexSchema,
  shape: 'https://example.com/TypeRegistration',
  context: publicTypeIndexContext,
}
