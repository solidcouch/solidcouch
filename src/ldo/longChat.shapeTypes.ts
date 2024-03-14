import { ShapeType } from '@ldo/ldo'
import { longChatSchema } from './longChat.schema'
import { longChatContext } from './longChat.context'
import {
  ChatShape,
  ChatParticipationShape,
  ChatMessageListShape,
  ChatMessageShape,
} from './longChat.typings'

/**
 * =============================================================================
 * LDO ShapeTypes longChat
 * =============================================================================
 */

/**
 * ChatShape ShapeType
 */
export const ChatShapeShapeType: ShapeType<ChatShape> = {
  schema: longChatSchema,
  shape: 'https://shaperepo.com/schemas/longChat#ChatShape',
  context: longChatContext,
}

/**
 * ChatParticipationShape ShapeType
 */
export const ChatParticipationShapeShapeType: ShapeType<ChatParticipationShape> =
  {
    schema: longChatSchema,
    shape: 'https://shaperepo.com/schemas/longChat#ChatParticipationShape',
    context: longChatContext,
  }

/**
 * ChatMessageListShape ShapeType
 */
export const ChatMessageListShapeShapeType: ShapeType<ChatMessageListShape> = {
  schema: longChatSchema,
  shape: 'https://shaperepo.com/schemas/longChat#ChatMessageListShape',
  context: longChatContext,
}

/**
 * ChatMessageShape ShapeType
 */
export const ChatMessageShapeShapeType: ShapeType<ChatMessageShape> = {
  schema: longChatSchema,
  shape: 'https://shaperepo.com/schemas/longChat#ChatMessageShape',
  context: longChatContext,
}
