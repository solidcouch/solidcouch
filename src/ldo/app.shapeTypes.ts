import { ShapeType } from 'ldo'
import { appSchema } from './app.schema'
import { appContext } from './app.context'
import {
  SolidProfile,
  HospexProfile,
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
 * HospexProfile ShapeType
 */
export const HospexProfileShapeType: ShapeType<HospexProfile> = {
  schema: appSchema,
  shape: 'https://example.com/HospexProfile',
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
