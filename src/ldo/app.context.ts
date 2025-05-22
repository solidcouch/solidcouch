import { LdoJsonldContext } from "@ldo/ldo";

/**
 * =============================================================================
 * appContext: JSONLD Context for app
 * =============================================================================
 */
export const appContext: LdoJsonldContext = {
  type: {
    "@id": "@type",
  },
  Person: {
    "@id": "http://xmlns.com/foaf/0.1/Person",
    "@context": {
      type: {
        "@id": "@type",
      },
      inbox: {
        "@id": "http://www.w3.org/ns/ldp#inbox",
        "@type": "@id",
      },
      preferencesFile: {
        "@id": "http://www.w3.org/ns/pim/space#preferencesFile",
        "@type": "@id",
      },
      storage: {
        "@id": "http://www.w3.org/ns/pim/space#storage",
        "@type": "@id",
        "@isCollection": true,
      },
      account: {
        "@id": "http://www.w3.org/ns/solid/terms#account",
        "@type": "@id",
      },
      privateTypeIndex: {
        "@id": "http://www.w3.org/ns/solid/terms#privateTypeIndex",
        "@type": "@id",
        "@isCollection": true,
      },
      publicTypeIndex: {
        "@id": "http://www.w3.org/ns/solid/terms#publicTypeIndex",
        "@type": "@id",
        "@isCollection": true,
      },
      oidcIssuer: {
        "@id": "http://www.w3.org/ns/solid/terms#oidcIssuer",
        "@type": "@id",
        "@isCollection": true,
      },
      knows: {
        "@id": "http://xmlns.com/foaf/0.1/knows",
        "@type": "@id",
        "@isCollection": true,
      },
      topicInterest: {
        "@id": "http://xmlns.com/foaf/0.1/topic_interest",
        "@type": "@id",
        "@isCollection": true,
      },
    },
  },
  inbox: {
    "@id": "http://www.w3.org/ns/ldp#inbox",
    "@type": "@id",
  },
  Container: {
    "@id": "http://www.w3.org/ns/ldp#Container",
    "@context": {
      type: {
        "@id": "@type",
      },
      contains: {
        "@id": "http://www.w3.org/ns/ldp#contains",
        "@type": "@id",
        "@isCollection": true,
      },
      modified: {
        "@id": "http://purl.org/dc/terms/modified",
        "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
      },
      mtime: {
        "@id": "http://www.w3.org/ns/posix/stat#mtime",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
      size: {
        "@id": "http://www.w3.org/ns/posix/stat#size",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
  },
  BasicContainer: {
    "@id": "http://www.w3.org/ns/ldp#BasicContainer",
    "@context": {
      type: {
        "@id": "@type",
      },
      contains: {
        "@id": "http://www.w3.org/ns/ldp#contains",
        "@type": "@id",
        "@isCollection": true,
      },
      modified: {
        "@id": "http://purl.org/dc/terms/modified",
        "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
      },
      mtime: {
        "@id": "http://www.w3.org/ns/posix/stat#mtime",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
      size: {
        "@id": "http://www.w3.org/ns/posix/stat#size",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
  },
  contains: {
    "@id": "http://www.w3.org/ns/ldp#contains",
    "@type": "@id",
    "@isCollection": true,
  },
  Create: {
    "@id": "https://www.w3.org/ns/activitystreams#Create",
    "@context": {
      type: {
        "@id": "@type",
      },
      actor: {
        "@id": "https://www.w3.org/ns/activitystreams#actor",
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
      to: {
        "@id": "https://www.w3.org/ns/activitystreams#to",
        "@type": "@id",
        "@isCollection": true,
      },
    },
  },
  actor: {
    "@id": "https://www.w3.org/ns/activitystreams#actor",
    "@type": "@id",
  },
  object: {
    "@id": "https://www.w3.org/ns/activitystreams#object",
    "@type": "@id",
  },
  Message: {
    "@id": "http://schema.org/Message",
    "@context": {
      type: {
        "@id": "@type",
      },
      created: {
        "@id": "http://purl.org/dc/terms/created",
        "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
      },
      content: {
        "@id": "http://rdfs.org/sioc/ns#content",
        "@type": "http://www.w3.org/2001/XMLSchema#string",
      },
      maker: {
        "@id": "http://xmlns.com/foaf/0.1/maker",
        "@type": "@id",
      },
    },
  },
  created: {
    "@id": "http://purl.org/dc/terms/created",
    "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
  },
  content: {
    "@id": "http://rdfs.org/sioc/ns#content",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  maker: {
    "@id": "http://xmlns.com/foaf/0.1/maker",
    "@type": "@id",
  },
  target: {
    "@id": "https://www.w3.org/ns/activitystreams#target",
    "@type": "@id",
  },
  LongChat: {
    "@id": "http://www.w3.org/ns/pim/meeting#LongChat",
    "@context": {
      type: {
        "@id": "@type",
      },
      author: {
        "@id": "http://purl.org/dc/elements/1.1/author",
        "@type": "@id",
      },
      created: {
        "@id": "http://purl.org/dc/elements/1.1/created",
        "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
      },
      title: {
        "@id": "http://purl.org/dc/elements/1.1/title",
        "@type": "http://www.w3.org/2001/XMLSchema#string",
      },
      participation: {
        "@id": "http://www.w3.org/2005/01/wf/flow#participation",
        "@type": "@id",
        "@isCollection": true,
      },
      sharedPreferences: {
        "@id": "http://www.w3.org/ns/ui#sharedPreferences",
        "@type": "@id",
      },
      message: {
        "@id": "http://www.w3.org/2005/01/wf/flow#message",
        "@type": "@id",
        "@isCollection": true,
      },
      message2: {
        "@id": "http://www.w3.org/ns/pim/meeting#message",
        "@type": "@id",
        "@isCollection": true,
      },
    },
  },
  author: {
    "@id": "http://purl.org/dc/elements/1.1/author",
    "@type": "@id",
  },
  created2: {
    "@id": "http://purl.org/dc/elements/1.1/created",
    "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
  },
  title: {
    "@id": "http://purl.org/dc/elements/1.1/title",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  participation: {
    "@id": "http://www.w3.org/2005/01/wf/flow#participation",
    "@type": "@id",
    "@isCollection": true,
  },
  dtstart: {
    "@id": "http://www.w3.org/2002/12/cal/ical#dtstart",
    "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
  },
  participant: {
    "@id": "http://www.w3.org/2005/01/wf/flow#participant",
    "@type": "@id",
  },
  backgroundColor: {
    "@id": "http://www.w3.org/ns/ui#backgroundColor",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  references: {
    "@id": "http://purl.org/dc/terms/references",
    "@type": "@id",
    "@isCollection": true,
  },
  sharedPreferences: {
    "@id": "http://www.w3.org/ns/ui#sharedPreferences",
    "@type": "@id",
  },
  message: {
    "@id": "http://www.w3.org/2005/01/wf/flow#message",
    "@type": "@id",
    "@isCollection": true,
  },
  message2: {
    "@id": "http://www.w3.org/ns/pim/meeting#message",
    "@type": "@id",
    "@isCollection": true,
  },
  to: {
    "@id": "https://www.w3.org/ns/activitystreams#to",
    "@type": "@id",
    "@isCollection": true,
  },
  Invite: {
    "@id": "https://www.w3.org/ns/activitystreams#Invite",
    "@context": {
      type: {
        "@id": "@type",
      },
      actor: {
        "@id": "https://www.w3.org/ns/activitystreams#actor",
        "@type": "@id",
      },
      content: {
        "@id": "https://www.w3.org/ns/activitystreams#content",
        "@type": "http://www.w3.org/2001/XMLSchema#string",
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
  content2: {
    "@id": "https://www.w3.org/ns/activitystreams#content",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  Relationship: {
    "@id": "https://www.w3.org/ns/activitystreams#Relationship",
    "@context": {
      type: {
        "@id": "@type",
      },
      subject: {
        "@id": "https://www.w3.org/ns/activitystreams#subject",
        "@type": "@id",
      },
      relationship: {
        "@id": "https://www.w3.org/ns/activitystreams#relationship",
      },
      object: {
        "@id": "https://www.w3.org/ns/activitystreams#object",
        "@type": "@id",
      },
    },
  },
  subject: {
    "@id": "https://www.w3.org/ns/activitystreams#subject",
    "@type": "@id",
  },
  relationship: {
    "@id": "https://www.w3.org/ns/activitystreams#relationship",
  },
  knows: {
    "@id": "http://xmlns.com/foaf/0.1/knows",
    "@type": "@id",
    "@isCollection": true,
  },
  updated: {
    "@id": "https://www.w3.org/ns/activitystreams#updated",
    "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
  },
  modified: {
    "@id": "http://purl.org/dc/terms/modified",
    "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
  },
  mtime: {
    "@id": "http://www.w3.org/ns/posix/stat#mtime",
    "@type": "http://www.w3.org/2001/XMLSchema#decimal",
  },
  size: {
    "@id": "http://www.w3.org/ns/posix/stat#size",
    "@type": "http://www.w3.org/2001/XMLSchema#decimal",
  },
  preferencesFile: {
    "@id": "http://www.w3.org/ns/pim/space#preferencesFile",
    "@type": "@id",
  },
  storage: {
    "@id": "http://www.w3.org/ns/pim/space#storage",
    "@type": "@id",
    "@isCollection": true,
  },
  account: {
    "@id": "http://www.w3.org/ns/solid/terms#account",
    "@type": "@id",
  },
  privateTypeIndex: {
    "@id": "http://www.w3.org/ns/solid/terms#privateTypeIndex",
    "@type": "@id",
    "@isCollection": true,
  },
  TypeIndex: {
    "@id": "http://www.w3.org/ns/solid/terms#TypeIndex",
    "@context": {
      type: {
        "@id": "@type",
      },
    },
  },
  UnlistedDocument: {
    "@id": "http://www.w3.org/ns/solid/terms#UnlistedDocument",
    "@context": {
      type: {
        "@id": "@type",
      },
    },
  },
  publicTypeIndex: {
    "@id": "http://www.w3.org/ns/solid/terms#publicTypeIndex",
    "@type": "@id",
    "@isCollection": true,
  },
  ListedDocument: {
    "@id": "http://www.w3.org/ns/solid/terms#ListedDocument",
    "@context": {
      type: {
        "@id": "@type",
      },
    },
  },
  oidcIssuer: {
    "@id": "http://www.w3.org/ns/solid/terms#oidcIssuer",
    "@type": "@id",
    "@isCollection": true,
  },
  topicInterest: {
    "@id": "http://xmlns.com/foaf/0.1/topic_interest",
    "@type": "@id",
    "@isCollection": true,
  },
  note: {
    "@id": "http://www.w3.org/2006/vcard/ns#note",
    "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
    "@isCollection": true,
  },
  name: {
    "@id": "http://xmlns.com/foaf/0.1/name",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  hasPhoto: {
    "@id": "http://www.w3.org/2006/vcard/ns#hasPhoto",
    "@type": "@id",
  },
  offers: {
    "@id": "http://w3id.org/hospex/ns#offers",
    "@type": "@id",
    "@isCollection": true,
  },
  Accommodation: {
    "@id": "http://w3id.org/hospex/ns#Accommodation",
    "@context": {
      type: {
        "@id": "@type",
      },
      description: {
        "@id": "http://purl.org/dc/terms/description",
        "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
        "@isCollection": true,
      },
      location: {
        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#location",
        "@type": "@id",
      },
      offeredBy: {
        "@id": "http://w3id.org/hospex/ns#offeredBy",
        "@type": "@id",
      },
    },
  },
  Accommodation2: {
    "@id": "http://schema.org/Accommodation",
    "@context": {
      type: {
        "@id": "@type",
      },
      description: {
        "@id": "http://purl.org/dc/terms/description",
        "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
        "@isCollection": true,
      },
      location: {
        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#location",
        "@type": "@id",
      },
      offeredBy: {
        "@id": "http://w3id.org/hospex/ns#offeredBy",
        "@type": "@id",
      },
    },
  },
  description: {
    "@id": "http://purl.org/dc/terms/description",
    "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
    "@isCollection": true,
  },
  location: {
    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#location",
    "@type": "@id",
  },
  Point: {
    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#Point",
    "@context": {
      type: {
        "@id": "@type",
      },
      lat: {
        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
      long: {
        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#long",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
  },
  lat: {
    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
    "@type": "http://www.w3.org/2001/XMLSchema#decimal",
  },
  long: {
    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#long",
    "@type": "http://www.w3.org/2001/XMLSchema#decimal",
  },
  offeredBy: {
    "@id": "http://w3id.org/hospex/ns#offeredBy",
    "@type": "@id",
  },
  memberOf: {
    "@id": "http://rdfs.org/sioc/ns#member_of",
    "@type": "@id",
    "@isCollection": true,
  },
  storage2: {
    "@id": "http://w3id.org/hospex/ns#storage",
    "@type": "@id",
  },
  ConfigurationFile: "http://www.w3.org/ns/pim/space#ConfigurationFile",
  TypeRegistration: {
    "@id": "http://www.w3.org/ns/solid/terms#TypeRegistration",
    "@context": {
      type: {
        "@id": "@type",
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
  Resource: {
    "@id": "http://www.w3.org/ns/ldp#Resource",
    "@context": {
      type: {
        "@id": "@type",
      },
      modified: {
        "@id": "http://purl.org/dc/terms/modified",
        "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
      },
      mtime: {
        "@id": "http://www.w3.org/ns/posix/stat#mtime",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
      size: {
        "@id": "http://www.w3.org/ns/posix/stat#size",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
  },
  Add: {
    "@id": "https://www.w3.org/ns/activitystreams#Add",
    "@context": {
      type: {
        "@id": "@type",
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
  context: {
    "@id": "https://www.w3.org/ns/activitystreams#context",
    "@type": "@id",
  },
};
