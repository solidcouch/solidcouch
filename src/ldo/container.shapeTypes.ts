import { ShapeType } from '@ldo/ldo'
import { containerContext } from './container.context.ts'
import { containerSchema } from './container.schema.ts'
import { Container, Resource } from './container.typings.ts'

/**
 * =============================================================================
 * LDO ShapeTypes container
 * =============================================================================
 */

/**
 * Container ShapeType
 */
export const ContainerShapeType: ShapeType<Container> = {
  schema: containerSchema,
  shape: 'https://example.com/Container',
  context: containerContext,
}

/**
 * Resource ShapeType
 */
export const ResourceShapeType: ShapeType<Resource> = {
  schema: containerSchema,
  shape: 'https://example.com/Resource',
  context: containerContext,
}
