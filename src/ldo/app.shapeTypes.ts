import { ShapeType } from "@ldo/ldo";
import { appSchema } from "./app.schema";
import { appContext } from "./app.context";
import {
  SolidProfile,
  FoafProfile,
  HospexProfile,
  Accommodation,
  Point,
  PublicTypeIndex,
  PrivateTypeIndex,
  Preferences,
  TypeRegistration,
  Chat,
  ChatParticipation,
  ChatMessage,
  Container,
  Resource,
  Inbox,
  MessageActivityDeprecated,
  MessageActivity,
  ContactInvitationActivity,
  ContactRelationship,
} from "./app.typings";

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
  shape: "https://example.com/SolidProfile",
  context: appContext,
};

/**
 * FoafProfile ShapeType
 */
export const FoafProfileShapeType: ShapeType<FoafProfile> = {
  schema: appSchema,
  shape: "https://example.com/FoafProfile",
  context: appContext,
};

/**
 * HospexProfile ShapeType
 */
export const HospexProfileShapeType: ShapeType<HospexProfile> = {
  schema: appSchema,
  shape: "https://example.com/HospexProfile",
  context: appContext,
};

/**
 * Accommodation ShapeType
 */
export const AccommodationShapeType: ShapeType<Accommodation> = {
  schema: appSchema,
  shape: "https://example.com/Accommodation",
  context: appContext,
};

/**
 * Point ShapeType
 */
export const PointShapeType: ShapeType<Point> = {
  schema: appSchema,
  shape: "https://example.com/Point",
  context: appContext,
};

/**
 * PublicTypeIndex ShapeType
 */
export const PublicTypeIndexShapeType: ShapeType<PublicTypeIndex> = {
  schema: appSchema,
  shape: "https://example.com/PublicTypeIndex",
  context: appContext,
};

/**
 * PrivateTypeIndex ShapeType
 */
export const PrivateTypeIndexShapeType: ShapeType<PrivateTypeIndex> = {
  schema: appSchema,
  shape: "https://example.com/PrivateTypeIndex",
  context: appContext,
};

/**
 * Preferences ShapeType
 */
export const PreferencesShapeType: ShapeType<Preferences> = {
  schema: appSchema,
  shape: "https://example.com/Preferences",
  context: appContext,
};

/**
 * TypeRegistration ShapeType
 */
export const TypeRegistrationShapeType: ShapeType<TypeRegistration> = {
  schema: appSchema,
  shape: "https://example.com/TypeRegistration",
  context: appContext,
};

/**
 * Chat ShapeType
 */
export const ChatShapeType: ShapeType<Chat> = {
  schema: appSchema,
  shape: "https://example.com/ChatShape",
  context: appContext,
};

/**
 * ChatParticipation ShapeType
 */
export const ChatParticipationShapeType: ShapeType<ChatParticipation> = {
  schema: appSchema,
  shape: "https://example.com/ChatParticipationShape",
  context: appContext,
};

/**
 * ChatMessage ShapeType
 */
export const ChatMessageShapeType: ShapeType<ChatMessage> = {
  schema: appSchema,
  shape: "https://example.com/ChatMessageShape",
  context: appContext,
};

/**
 * Container ShapeType
 */
export const ContainerShapeType: ShapeType<Container> = {
  schema: appSchema,
  shape: "https://example.com/Container",
  context: appContext,
};

/**
 * Resource ShapeType
 */
export const ResourceShapeType: ShapeType<Resource> = {
  schema: appSchema,
  shape: "https://example.com/Resource",
  context: appContext,
};

/**
 * Inbox ShapeType
 */
export const InboxShapeType: ShapeType<Inbox> = {
  schema: appSchema,
  shape: "https://example.com/Inbox",
  context: appContext,
};

/**
 * MessageActivityDeprecated ShapeType
 */
export const MessageActivityDeprecatedShapeType: ShapeType<MessageActivityDeprecated> =
  {
    schema: appSchema,
    shape: "https://example.com/MessageActivityDeprecated",
    context: appContext,
  };

/**
 * MessageActivity ShapeType
 */
export const MessageActivityShapeType: ShapeType<MessageActivity> = {
  schema: appSchema,
  shape: "https://example.com/MessageActivity",
  context: appContext,
};

/**
 * ContactInvitationActivity ShapeType
 */
export const ContactInvitationActivityShapeType: ShapeType<ContactInvitationActivity> =
  {
    schema: appSchema,
    shape: "https://example.com/ContactInvitationActivity",
    context: appContext,
  };

/**
 * ContactRelationship ShapeType
 */
export const ContactRelationshipShapeType: ShapeType<ContactRelationship> = {
  schema: appSchema,
  shape: "https://example.com/ContactRelationship",
  context: appContext,
};
