import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * Typescript Typings for app
 * =============================================================================
 */

/**
 * SolidProfile Type
 */
export interface SolidProfile {
  '@id'?: string
  '@context'?: ContextDefinition
  /**
   * Defines the node as a Person (from foaf)
   */
  type: {
    '@id': 'Person'
  }
  /**
   * The user's LDP inbox to which apps can post notifications
   */
  inbox: Inbox
  /**
   * The user's preferences
   */
  preferencesFile?: {
    '@id': string
  }
  /**
   * The location of a Solid storage server related to this WebId
   */
  storage?: {
    '@id': string
  }[]
  /**
   * The user's account
   */
  account?: {
    '@id': string
  }
  /**
   * A registry of all types used on the user's Pod (for private access only)
   */
  privateTypeIndex?: PrivateTypeIndex[]
  /**
   * A registry of all types used on the user's Pod (for public access)
   */
  publicTypeIndex?: PublicTypeIndex[]
  /**
   * Solid OIDC issuer for a webId.
   */
  oidcIssuer: {
    '@id': string
  }[]
}

/**
 * FoafProfile Type
 */
export interface FoafProfile {
  '@id'?: string
  '@context'?: ContextDefinition
  /**
   * Defines the node as a Person (from foaf)
   */
  type: {
    '@id': 'Person'
  }
  /**
   * A list of WebIds for all the people this user knows.
   */
  knows?: FoafProfile[]
  /**
   * A list of person's interests.
   */
  topicInterest?: {
    '@id': string
  }[]
}

/**
 * HospexProfile Type
 */
export interface HospexProfile {
  '@id'?: string
  '@context'?: ContextDefinition
  /**
   * Text about person, in different languages
   */
  note?: string[]
  name?: string
  hasPhoto?: {
    '@id': string
  }
  /**
   * Accommodation that the person offers
   */
  offers?: Accommodation[]
  memberOf?: {
    '@id': string
  }[]
  storage2: {
    '@id': string
  }
}

/**
 * Accommodation Type
 */
export interface Accommodation {
  '@id'?: string
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'Accommodation'
      }
    | {
        '@id': 'Accommodation2'
      }
  )[]
  /**
   * Text about the accommodation
   */
  description?: string[]
  /**
   * Location of the accommodation
   */
  location: Point
  offeredBy: HospexProfile
}

/**
 * Point Type
 */
export interface Point {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'Point'
  }
  /**
   * Latitude of the location in WGS84
   */
  lat: number
  /**
   * Longitude of the location in WGS84
   */
  long: number
}

/**
 * PublicTypeIndex Type
 */
export interface PublicTypeIndex {
  '@id'?: string
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'TypeIndex'
      }
    | {
        '@id': 'ListedDocument'
      }
  )[]
  references?: TypeRegistration[]
}

/**
 * PrivateTypeIndex Type
 */
export interface PrivateTypeIndex {
  '@id'?: string
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'TypeIndex'
      }
    | {
        '@id': 'UnlistedDocument'
      }
  )[]
  references?: TypeRegistration[]
}

/**
 * TypeRegistration Type
 */
export interface TypeRegistration {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'TypeRegistration'
  }
  forClass: {
    '@id': string
  }[]
  instance?: (
    | {
        '@id': string
      }
    | ChatShape
  )[]
  instanceContainer?: {
    '@id': string
  }[]
}

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
  created2: string
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
  message?: ChatMessageShape[]
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
  references?: ChatShape[]
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
  created: string
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

/**
 * Container Type
 */
export interface Container {
  '@id'?: string
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'Container'
      }
    | {
        '@id': 'BasicContainer'
      }
  )[]
  contains?: (Resource | Container)[]
  modified: string
  mtime: number
  size: number
}

/**
 * Resource Type
 */
export interface Resource {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'Resource'
  }
  modified: string
  mtime: number
  size: number
}

/**
 * Inbox Type
 */
export interface Inbox {
  '@id'?: string
  '@context'?: ContextDefinition
  type: (
    | {
        '@id': 'Container'
      }
    | {
        '@id': 'BasicContainer'
      }
  )[]
  contains?: (MessageActivity | ContactInvitationActivity)[]
  modified: string
  mtime: number
  size: number
}

/**
 * MessageActivity Type
 */
export interface MessageActivity {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'Add'
  }
  actor: {
    '@id': string
  }
  context: {
    '@id': string
  }
  object: ChatMessageShape
  target: ChatShape
  updated: string
}

/**
 * ContactInvitationActivity Type
 */
export interface ContactInvitationActivity {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'Invite'
  }
  actor: {
    '@id': string
  }
  content2: string
  object: ContactRelationship
  target: {
    '@id': string
  }
  updated: string
}

/**
 * ContactRelationship Type
 */
export interface ContactRelationship {
  '@id'?: string
  '@context'?: ContextDefinition
  type: {
    '@id': 'Relationship'
  }
  subject: {
    '@id': string
  }
  relationship: {
    '@id': 'knows'
  }
  object: {
    '@id': string
  }
}
