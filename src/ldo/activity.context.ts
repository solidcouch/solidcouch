import { LdoJsonldContext } from "@ldo/ldo";

/**
 * =============================================================================
 * activityContext: JSONLD Context for activity
 * =============================================================================
 */
export const activityContext: LdoJsonldContext = {
  type: {
    "@id": "@type",
    "@isCollection": true,
  },
  Add: {
    "@id": "https://www.w3.org/ns/activitystreams#Add",
    "@context": {
      type: {
        "@id": "@type",
        "@isCollection": true,
      },
      actor: {
        "@id": "https://www.w3.org/ns/activitystreams#actor",
        "@type": "@id",
      },
      context: {
        "@id": "https://www.w3.org/ns/activitystreams#context",
        "@type": "@id",
      },
      object: {
        "@id": "https://www.w3.org/ns/activitystreams#object",
        "@type": "@id",
      },
      target: {
        "@id": "https://www.w3.org/ns/activitystreams#target",
        "@type": "@id",
      },
      updated: {
        "@id": "https://www.w3.org/ns/activitystreams#updated",
        "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
      },
    },
  },
  actor: {
    "@id": "https://www.w3.org/ns/activitystreams#actor",
    "@type": "@id",
  },
  context: {
    "@id": "https://www.w3.org/ns/activitystreams#context",
    "@type": "@id",
  },
  object: {
    "@id": "https://www.w3.org/ns/activitystreams#object",
    "@type": "@id",
  },
  target: {
    "@id": "https://www.w3.org/ns/activitystreams#target",
    "@type": "@id",
  },
  updated: {
    "@id": "https://www.w3.org/ns/activitystreams#updated",
    "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
  },
};
