import { LdoJsonldContext, LdSet } from "@ldo/ldo";

/**
 * =============================================================================
 * Typescript Typings for solidProfile
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
  inbox: {
    "@id": string;
  };
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
  privateTypeIndex?: LdSet<{
    "@id": string;
  }>;
  /**
   * A registry of all types used on the user's Pod (for public access)
   */
  publicTypeIndex?: LdSet<{
    "@id": string;
  }>;
}
