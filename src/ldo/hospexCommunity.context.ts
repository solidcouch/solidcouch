import { LdoJsonldContext } from "@ldo/ldo";

/**
 * =============================================================================
 * hospexCommunityContext: JSONLD Context for hospexCommunity
 * =============================================================================
 */
export const hospexCommunityContext: LdoJsonldContext = {
  type: {
    "@id": "@type",
    "@isCollection": true,
  },
  Community: {
    "@id": "http://w3id.org/hospex/ns#Community",
    "@context": {
      type: {
        "@id": "@type",
        "@isCollection": true,
      },
      name: {
        "@id": "http://rdfs.org/sioc/ns#name",
        "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
        "@isCollection": true,
      },
      about: {
        "@id": "http://rdfs.org/sioc/ns#about",
        "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
        "@isCollection": true,
      },
      note: {
        "@id": "http://rdfs.org/sioc/ns#note",
        "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
        "@isCollection": true,
      },
      logo: {
        "@id": "http://xmlns.com/foaf/0.1/logo",
        "@type": "@id",
        "@isCollection": true,
      },
      homepage: {
        "@id": "http://xmlns.com/foaf/0.1/homepage",
        "@type": "@id",
      },
      inbox: {
        "@id": "http://www.w3.org/ns/ldp#inbox",
        "@type": "@id",
      },
      hasUsergroup: {
        "@id": "http://rdfs.org/sioc/ns#has_usergroup",
        "@type": "@id",
        "@isCollection": true,
      },
    },
  },
  Community2: {
    "@id": "http://rdfs.org/sioc/ns#Community",
    "@context": {
      type: {
        "@id": "@type",
        "@isCollection": true,
      },
      name: {
        "@id": "http://rdfs.org/sioc/ns#name",
        "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
        "@isCollection": true,
      },
      about: {
        "@id": "http://rdfs.org/sioc/ns#about",
        "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
        "@isCollection": true,
      },
      note: {
        "@id": "http://rdfs.org/sioc/ns#note",
        "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
        "@isCollection": true,
      },
      logo: {
        "@id": "http://xmlns.com/foaf/0.1/logo",
        "@type": "@id",
        "@isCollection": true,
      },
      homepage: {
        "@id": "http://xmlns.com/foaf/0.1/homepage",
        "@type": "@id",
      },
      inbox: {
        "@id": "http://www.w3.org/ns/ldp#inbox",
        "@type": "@id",
      },
      hasUsergroup: {
        "@id": "http://rdfs.org/sioc/ns#has_usergroup",
        "@type": "@id",
        "@isCollection": true,
      },
    },
  },
  name: {
    "@id": "http://rdfs.org/sioc/ns#name",
    "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
    "@isCollection": true,
  },
  about: {
    "@id": "http://rdfs.org/sioc/ns#about",
    "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
    "@isCollection": true,
  },
  note: {
    "@id": "http://rdfs.org/sioc/ns#note",
    "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
    "@isCollection": true,
  },
  logo: {
    "@id": "http://xmlns.com/foaf/0.1/logo",
    "@type": "@id",
    "@isCollection": true,
  },
  homepage: {
    "@id": "http://xmlns.com/foaf/0.1/homepage",
    "@type": "@id",
  },
  inbox: {
    "@id": "http://www.w3.org/ns/ldp#inbox",
    "@type": "@id",
  },
  hasUsergroup: {
    "@id": "http://rdfs.org/sioc/ns#has_usergroup",
    "@type": "@id",
    "@isCollection": true,
  },
  Group: {
    "@id": "http://www.w3.org/2006/vcard/ns#Group",
    "@context": {
      type: {
        "@id": "@type",
        "@isCollection": true,
      },
      usergroupOf: {
        "@id": "http://rdfs.org/sioc/ns#usergroup_of",
        "@type": "@id",
      },
      hasMember: {
        "@id": "http://www.w3.org/2006/vcard/ns#hasMember",
        "@type": "@id",
        "@isCollection": true,
      },
    },
  },
  Usergroup: {
    "@id": "http://rdfs.org/sioc/ns#Usergroup",
    "@context": {
      type: {
        "@id": "@type",
        "@isCollection": true,
      },
      usergroupOf: {
        "@id": "http://rdfs.org/sioc/ns#usergroup_of",
        "@type": "@id",
      },
      hasMember: {
        "@id": "http://www.w3.org/2006/vcard/ns#hasMember",
        "@type": "@id",
        "@isCollection": true,
      },
    },
  },
  usergroupOf: {
    "@id": "http://rdfs.org/sioc/ns#usergroup_of",
    "@type": "@id",
  },
  hasMember: {
    "@id": "http://www.w3.org/2006/vcard/ns#hasMember",
    "@type": "@id",
    "@isCollection": true,
  },
};
