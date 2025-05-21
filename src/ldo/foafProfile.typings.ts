import { LdoJsonldContext, LdSet } from "@ldo/ldo";

/**
 * =============================================================================
 * Typescript Typings for foafProfile
 * =============================================================================
 */

/**
 * FoafProfile Type
 */
export interface FoafProfile {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Defines the node as a Person (from foaf)
   */
  type: {
    "@id": "Person";
  };
  /**
   * Define a person's name.
   */
  name?: string;
  /**
   * Photo link but in string form
   */
  img?: string;
  /**
   * A link to the person's photo
   */
  hasPhoto?: {
    "@id": string;
  };
  /**
   * A list of WebIds for all the people this user knows.
   */
  knows?: LdSet<FoafProfile>;
}
