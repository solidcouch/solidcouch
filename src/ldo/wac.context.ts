import { LdoJsonldContext } from "@ldo/ldo";

/**
 * =============================================================================
 * wacContext: JSONLD Context for wac
 * =============================================================================
 */
export const wacContext: LdoJsonldContext = {
  type: {
    "@id": "@type",
    "@isCollection": true,
  },
  Authorization: {
    "@id": "http://www.w3.org/ns/auth/acl#Authorization",
    "@context": {
      type: {
        "@id": "@type",
        "@isCollection": true,
      },
      accessTo: {
        "@id": "http://www.w3.org/ns/auth/acl#accessTo",
        "@type": "@id",
      },
      default: {
        "@id": "http://www.w3.org/ns/auth/acl#default",
        "@type": "@id",
      },
      agent: {
        "@id": "http://www.w3.org/ns/auth/acl#agent",
        "@type": "@id",
        "@isCollection": true,
      },
      agentClass: {
        "@id": "http://www.w3.org/ns/auth/acl#agentClass",
        "@type": "@id",
        "@isCollection": true,
      },
      agentGroup: {
        "@id": "http://www.w3.org/ns/auth/acl#agentGroup",
        "@type": "@id",
        "@isCollection": true,
      },
      mode: {
        "@id": "http://www.w3.org/ns/auth/acl#mode",
        "@isCollection": true,
      },
      origin: {
        "@id": "http://www.w3.org/ns/auth/acl#origin",
        "@type": "@id",
        "@isCollection": true,
      },
    },
  },
  accessTo: {
    "@id": "http://www.w3.org/ns/auth/acl#accessTo",
    "@type": "@id",
  },
  default: {
    "@id": "http://www.w3.org/ns/auth/acl#default",
    "@type": "@id",
  },
  agent: {
    "@id": "http://www.w3.org/ns/auth/acl#agent",
    "@type": "@id",
    "@isCollection": true,
  },
  agentClass: {
    "@id": "http://www.w3.org/ns/auth/acl#agentClass",
    "@type": "@id",
    "@isCollection": true,
  },
  agentGroup: {
    "@id": "http://www.w3.org/ns/auth/acl#agentGroup",
    "@type": "@id",
    "@isCollection": true,
  },
  mode: {
    "@id": "http://www.w3.org/ns/auth/acl#mode",
    "@isCollection": true,
  },
  Read: "http://www.w3.org/ns/auth/acl#Read",
  Write: "http://www.w3.org/ns/auth/acl#Write",
  Control: "http://www.w3.org/ns/auth/acl#Control",
  Append: "http://www.w3.org/ns/auth/acl#Append",
  origin: {
    "@id": "http://www.w3.org/ns/auth/acl#origin",
    "@type": "@id",
    "@isCollection": true,
  },
};
