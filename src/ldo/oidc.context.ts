import { LdoJsonldContext } from "@ldo/ldo";

/**
 * =============================================================================
 * oidcContext: JSONLD Context for oidc
 * =============================================================================
 */
export const oidcContext: LdoJsonldContext = {
  oidcIssuer: {
    "@id": "http://www.w3.org/ns/solid/terms#oidcIssuer",
    "@type": "@id",
    "@isCollection": true,
  },
};
