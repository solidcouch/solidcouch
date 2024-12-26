import { ShapeType } from '@ldo/ldo'
import { containerContext } from './container.context'
import { containerSchema } from './container.schema'
import { Container, Resource } from './container.typings'

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
