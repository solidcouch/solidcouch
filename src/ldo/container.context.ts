import { LdoJsonldContext } from "@ldo/ldo";

/**
 * =============================================================================
 * containerContext: JSONLD Context for container
 * =============================================================================
 */
export const containerContext: LdoJsonldContext = {
  type: {
    "@id": "@type",
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
};
