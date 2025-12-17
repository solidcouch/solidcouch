import { LdoJsonldContext, LdSet } from "@ldo/ldo";

/**
 * =============================================================================
 * Typescript Typings for app
 * =============================================================================
 */

/**
 * SolidProfile Type
 */
export interface SolidProfile {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Defines the node as a Person (from foaf)
   */
  type: LdSet<{
    "@id": "Person";
  }>;
  /**
   * The user's LDP inbox to which apps can post notifications
   */
  inbox: Inbox;
  /**
   * The user's preferences
   */
  preferencesFile?: {
    "@id": string;
  };
  /**
   * The location of a Solid storage server related to this WebId
   */
  storage?: LdSet<{
    "@id": string;
  }>;
  /**
   * The user's account
   */
  account?: {
    "@id": string;
  };
  /**
   * A registry of all types used on the user's Pod (for private access only)
   */
  privateTypeIndex?: LdSet<PrivateTypeIndex>;
  /**
   * A registry of all types used on the user's Pod (for public access)
   */
  publicTypeIndex?: LdSet<PublicTypeIndex>;
  /**
   * Solid OIDC issuer for a webId.
   */
  oidcIssuer: LdSet<{
    "@id": string;
  }>;
}

/**
 * FoafProfile Type
 */
export interface FoafProfile {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Defines the node as a Person (from foaf)
   */
  type: LdSet<{
    "@id": "Person";
  }>;
  /**
   * A list of WebIds for all the people this user knows.
   */
  knows?: LdSet<FoafProfile>;
  /**
   * A list of person's interests.
   */
  topicInterest?: LdSet<{
    "@id": string;
  }>;
}

/**
 * HospexProfile Type
 */
export interface HospexProfile {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Text about person, in different languages
   */
  note?: LdSet<string>;
  name?: string;
  hasPhoto?: {
    "@id": string;
  };
  /**
   * Accommodation that the person offers
   */
  offers?: LdSet<Accommodation>;
  memberOf?: LdSet<{
    "@id": string;
  }>;
  storage2: {
    "@id": string;
  };
}

/**
 * Accommodation Type
 */
export interface Accommodation {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<
    | {
        "@id": "Accommodation";
      }
    | {
        "@id": "Accommodation2";
      }
  >;
  /**
   * Text about the accommodation
   */
  description?: LdSet<string>;
  /**
   * Location of the accommodation
   */
  location: Point;
  offeredBy: HospexProfile;
}

/**
 * Point Type
 */
export interface Point {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<{
    "@id": "Point";
  }>;
  /**
   * Latitude of the location in WGS84
   */
  lat: number;
  /**
   * Longitude of the location in WGS84
   */
  long: number;
}

/**
 * PublicTypeIndex Type
 */
export interface PublicTypeIndex {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<
    | {
        "@id": "TypeIndex";
      }
    | {
        "@id": "ListedDocument";
      }
  >;
}

/**
 * PrivateTypeIndex Type
 */
export interface PrivateTypeIndex {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<
    | {
        "@id": "TypeIndex";
      }
    | {
        "@id": "UnlistedDocument";
      }
  >;
}

/**
 * Preferences Type
 */
export interface Preferences {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<{
    "@id": "ConfigurationFile";
  }>;
}

/**
 * TypeRegistration Type
 */
export interface TypeRegistration {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<{
    "@id": "TypeRegistration";
  }>;
  forClass: LdSet<{
    "@id": string;
  }>;
  instance?: LdSet<
    | {
        "@id": string;
      }
    | Chat
  >;
  instanceContainer?: LdSet<{
    "@id": string;
  }>;
}

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
   * A list of messages in the chat
   */
  message?: LdSet<ChatMessage>;
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
  references?: LdSet<Chat>;
}

/**
 * ChatMessage Type
 */
export interface ChatMessage {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type?: LdSet<{
    "@id": "Message";
  }>;
  /**
   * The date and time this message was posted.
   */
  created: string;
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

/**
 * Container Type
 */
export interface Container {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<
    | {
        "@id": "Container";
      }
    | {
        "@id": "BasicContainer";
      }
  >;
  contains?: LdSet<Resource | Container>;
  modified: string;
  mtime: number;
  size: number;
}

/**
 * Resource Type
 */
export interface Resource {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<{
    "@id": "Resource";
  }>;
  modified: string;
  mtime: number;
  size: number;
}

/**
 * Inbox Type
 */
export interface Inbox {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<
    | {
        "@id": "Container";
      }
    | {
        "@id": "BasicContainer";
      }
  >;
  contains?: LdSet<MessageActivity | ContactInvitationActivity>;
  modified: string;
  mtime: number;
  size: number;
}

/**
 * MessageActivityDeprecated Type
 */
export interface MessageActivityDeprecated {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<{
    "@id": "Add";
  }>;
  actor: {
    "@id": string;
  };
  context: {
    "@id": string;
  };
  object: ChatMessage;
  target: Chat;
  updated: string;
}

/**
 * MessageActivity Type
 */
export interface MessageActivity {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<{
    "@id": "Create";
  }>;
  actor: {
    "@id": string;
  };
  object: ChatMessage;
  target: Chat;
  to?: LdSet<{
    "@id": string;
  }>;
}

/**
 * ContactInvitationActivity Type
 */
export interface ContactInvitationActivity {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<{
    "@id": "Invite";
  }>;
  actor: {
    "@id": string;
  };
  content: string;
  object: ContactRelationship;
  target: {
    "@id": string;
  };
  updated: string;
}

/**
 * ContactRelationship Type
 */
export interface ContactRelationship {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: LdSet<{
    "@id": "Relationship";
  }>;
  subject: {
    "@id": string;
  };
  relationship: {
    "@id": "knows";
  };
  object: {
    "@id": string;
  };
}
