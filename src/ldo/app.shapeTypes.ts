import { ShapeType } from 'ldo'
import { appSchema } from './app.schema'
import { appContext } from './app.context'
import {
  SolidProfile,
  FoafProfile,
  HospexProfile,
  Accommodation,
  Point,
  PublicTypeIndex,
  PrivateTypeIndex,
  TypeRegistration,
  ChatShape,
  ChatParticipationShape,
  ChatMessageListShape,
  ChatMessageShape,
  Container,
  Resource,
  Inbox,
  MessageActivity,
} from './app.typings'

/**
 * =============================================================================
 * LDO ShapeTypes app
 * =============================================================================
 */

/**
 * SolidProfile ShapeType
 */
export const SolidProfileShapeType: ShapeType<SolidProfile> = {
  schema: appSchema,
  shape: 'https://example.com/SolidProfile',
  context: appContext,
}

/**
 * FoafProfile ShapeType
 */
export const FoafProfileShapeType: ShapeType<FoafProfile> = {
  schema: appSchema,
  shape: 'https://example.com/FoafProfile',
  context: appContext,
}

/**
 * HospexProfile ShapeType
 */
export const HospexProfileShapeType: ShapeType<HospexProfile> = {
  schema: appSchema,
  shape: 'https://example.com/HospexProfile',
  context: appContext,
}

/**
 * Accommodation ShapeType
 */
export const AccommodationShapeType: ShapeType<Accommodation> = {
  schema: appSchema,
  shape: 'https://example.com/Accommodation',
  context: appContext,
}

/**
 * Point ShapeType
 */
export const PointShapeType: ShapeType<Point> = {
  schema: appSchema,
  shape: 'https://example.com/Point',
  context: appContext,
}

/**
 * PublicTypeIndex ShapeType
 */
export const PublicTypeIndexShapeType: ShapeType<PublicTypeIndex> = {
  schema: appSchema,
  shape: 'https://example.com/PublicTypeIndex',
  context: appContext,
}

/**
 * PrivateTypeIndex ShapeType
 */
export const PrivateTypeIndexShapeType: ShapeType<PrivateTypeIndex> = {
  schema: appSchema,
  shape: 'https://example.com/PrivateTypeIndex',
  context: appContext,
}

/**
 * TypeRegistration ShapeType
 */
export const TypeRegistrationShapeType: ShapeType<TypeRegistration> = {
  schema: appSchema,
  shape: 'https://example.com/TypeRegistration',
  context: appContext,
}

/**
 * ChatShape ShapeType
 */
export const ChatShapeShapeType: ShapeType<ChatShape> = {
  schema: appSchema,
  shape: 'https://example.com/ChatShape',
  context: appContext,
}

/**
 * ChatParticipationShape ShapeType
 */
export const ChatParticipationShapeShapeType: ShapeType<ChatParticipationShape> =
  {
    schema: appSchema,
    shape: 'https://example.com/ChatParticipationShape',
    context: appContext,
  }

/**
 * ChatMessageListShape ShapeType
 */
export const ChatMessageListShapeShapeType: ShapeType<ChatMessageListShape> = {
  schema: appSchema,
  shape: 'https://example.com/ChatMessageListShape',
  context: appContext,
}

/**
 * ChatMessageShape ShapeType
 */
export const ChatMessageShapeShapeType: ShapeType<ChatMessageShape> = {
  schema: appSchema,
  shape: 'https://example.com/ChatMessageShape',
  context: appContext,
}

/**
 * Container ShapeType
 */
export const ContainerShapeType: ShapeType<Container> = {
  schema: appSchema,
  shape: 'https://example.com/Container',
  context: appContext,
}

/**
 * Resource ShapeType
 */
export const ResourceShapeType: ShapeType<Resource> = {
  schema: appSchema,
  shape: 'https://example.com/Resource',
  context: appContext,
}

/**
 * Inbox ShapeType
 */
export const InboxShapeType: ShapeType<Inbox> = {
  schema: appSchema,
  shape: 'https://example.com/Inbox',
  context: appContext,
}

/**
 * MessageActivity ShapeType
 */
export const MessageActivityShapeType: ShapeType<MessageActivity> = {
  schema: appSchema,
  shape: 'https://example.com/MessageActivity',
  context: appContext,
}
