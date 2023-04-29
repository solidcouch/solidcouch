import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * Typescript Typings for longChat
 * =============================================================================
 */

/**
 * ChatShape Type
 */
export interface ChatShape {
  '@id'?: string
  '@context'?: ContextDefinition
  /**
   * Defines the type of the chat as a LongChat
   */
  type: {
    '@id': 'LongChat'
  }
  /**
   * The WebId of the entity that created this chat
   */
  author: {
    '@id': string
  }
  /**
   * The date and time the chat was created
   */
  created: string
  /**
   * The title of the chat
   */
  title: string
  /**
   * A list of people participating in this chat
   */
  participation?: ChatParticipationShape[]
  /**
   * Chat preferences
   */
  sharedPreferences?: {
    '@id': string
  }
}

/**
 * ChatParticipationShape Type
 */
export interface ChatParticipationShape {
  '@id'?: string
  '@context'?: ContextDefinition
  /**
   * The date and time this individual began participating in the chat.
   */
  dtstart: string
  /**
   * The WebId of the participant
   */
  participant: {
    '@id': string
  }
  /**
   * The background color of the participant's chat bubbles
   */
  backgroundColor?: string
  /**
   * Part of this chat belonging to this participant
   */
  references?: {
    '@id': string
  }
}

/**
 * ChatMessageListShape Type
 */
export interface ChatMessageListShape {
  '@id'?: string
  '@context'?: ContextDefinition
  /**
   * A list of messages in the chat
   */
  message?: ChatMessageShape[]
}

/**
 * ChatMessageShape Type
 */
export interface ChatMessageShape {
  '@id'?: string
  '@context'?: ContextDefinition
  /**
   * The date and time this message was posted.
   */
  created2: string
  /**
   * The text content of the message
   */
  content: string
  /**
   * The WebId of the person who sent the message.
   */
  maker: {
    '@id': string
  }
}
