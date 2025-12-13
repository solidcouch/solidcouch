import { LdoJsonldContext, LdSet } from "@ldo/ldo";

/**
 * =============================================================================
 * Typescript Typings for longChat
 * =============================================================================
 */

/**
 * Chat Type
 */
export interface Chat {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Defines the type of the chat as a LongChat
   */
  type: LdSet<{
    "@id": "LongChat";
  }>;
  /**
   * The WebId of the entity that created this chat
   */
  author: {
    "@id": string;
  };
  /**
   * The date and time the chat was created
   */
  created: string;
  /**
   * The title of the chat
   */
  title: string;
  /**
   * A list of people participating in this chat
   */
  participation?: LdSet<ChatParticipation>;
  /**
   * Chat preferences
   */
  sharedPreferences?: {
    "@id": string;
  };
  /**
   * deprecated
   */
  message?: LdSet<ChatMessage>;
  /**
   * A list of messages in the chat
   */
  message2?: LdSet<ChatMessage>;
}

/**
 * ChatParticipation Type
 */
export interface ChatParticipation {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * The date and time this individual began participating in the chat.
   */
  dtstart: string;
  /**
   * The WebId of the participant
   */
  participant: {
    "@id": string;
  };
  /**
   * The background color of the participant's chat bubbles
   */
  backgroundColor?: string;
  /**
   * Part of this chat belonging to this participant
   */
  references?: {
    "@id": string;
  };
}

/**
 * ChatMessage Type
 */
export interface ChatMessage {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * The date and time this message was posted.
   */
  created2: string;
  /**
   * The text content of the message
   */
  content: string;
  /**
   * The WebId of the person who sent the message.
   */
  maker: {
    "@id": string;
  };
}
