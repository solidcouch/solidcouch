import { ShapeType } from "@ldo/ldo";
import { longChatSchema } from "./longChat.schema";
import { longChatContext } from "./longChat.context";
import { Chat, ChatParticipation, ChatMessage } from "./longChat.typings";

/**
 * =============================================================================
 * LDO ShapeTypes longChat
 * =============================================================================
 */

/**
 * Chat ShapeType
 */
export const ChatShapeType: ShapeType<Chat> = {
  schema: longChatSchema,
  shape: "https://shaperepo.com/schemas/longChat#ChatShape",
  context: longChatContext,
};

/**
 * ChatParticipation ShapeType
 */
export const ChatParticipationShapeType: ShapeType<ChatParticipation> = {
  schema: longChatSchema,
  shape: "https://shaperepo.com/schemas/longChat#ChatParticipationShape",
  context: longChatContext,
};

/**
 * ChatMessage ShapeType
 */
export const ChatMessageShapeType: ShapeType<ChatMessage> = {
  schema: longChatSchema,
  shape: "https://shaperepo.com/schemas/longChat#ChatMessageShape",
  context: longChatContext,
};
