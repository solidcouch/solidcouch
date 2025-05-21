import { LdoJsonldContext, LdSet } from "@ldo/ldo";

/**
 * =============================================================================
 * Typescript Typings for hospexProfile
 * =============================================================================
 */

/**
 * HospexProfile Type
 */
export interface HospexProfile {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: {
    "@id": "Person";
  };
  note?: LdSet<string>;
  name?: string;
  hasPhoto?: {
    "@id": string;
  };
  /**
   * Accommodation that the person offers
   */
  offers?: LdSet<{
    "@id": string;
  }>;
}
