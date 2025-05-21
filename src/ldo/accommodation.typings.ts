import { LdoJsonldContext, LdSet } from "@ldo/ldo";

/**
 * =============================================================================
 * Typescript Typings for accommodation
 * =============================================================================
 */

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
  offeredBy: {
    "@id": string;
  };
}

/**
 * Point Type
 */
export interface Point {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  type: {
    "@id": "Point";
  };
  /**
   * Latitude of the location in WGS84
   */
  lat: number;
  /**
   * Longitude of the location in WGS84
   */
  long: number;
}
