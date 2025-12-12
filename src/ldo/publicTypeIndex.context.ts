import { LdoJsonldContext } from "@ldo/ldo";

/**
 * =============================================================================
 * publicTypeIndexContext: JSONLD Context for publicTypeIndex
 * =============================================================================
 */
export const publicTypeIndexContext: LdoJsonldContext = {
  type: {
    "@id": "@type",
    "@isCollection": true,
  },
  TypeIndex: {
    "@id": "http://www.w3.org/ns/solid/terms#TypeIndex",
    "@context": {
      type: {
        "@id": "@type",
        "@isCollection": true,
      },
    },
  },
  ListedDocument: {
    "@id": "http://www.w3.org/ns/solid/terms#ListedDocument",
    "@context": {
      type: {
        "@id": "@type",
        "@isCollection": true,
      },
    },
  },
  TypeRegistration: {
    "@id": "http://www.w3.org/ns/solid/terms#TypeRegistration",
    "@context": {
      type: {
        "@id": "@type",
        "@isCollection": true,
      },
      forClass: {
        "@id": "http://www.w3.org/ns/solid/terms#forClass",
        "@type": "@id",
        "@isCollection": true,
      },
      instance: {
        "@id": "http://www.w3.org/ns/solid/terms#instance",
        "@type": "@id",
        "@isCollection": true,
      },
      instanceContainer: {
        "@id": "http://www.w3.org/ns/solid/terms#instanceContainer",
        "@type": "@id",
        "@isCollection": true,
      },
    },
  },
  forClass: {
    "@id": "http://www.w3.org/ns/solid/terms#forClass",
    "@type": "@id",
    "@isCollection": true,
  },
  instance: {
    "@id": "http://www.w3.org/ns/solid/terms#instance",
    "@type": "@id",
    "@isCollection": true,
  },
  instanceContainer: {
    "@id": "http://www.w3.org/ns/solid/terms#instanceContainer",
    "@type": "@id",
    "@isCollection": true,
  },
};
