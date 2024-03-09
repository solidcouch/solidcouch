import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * containerContext: JSONLD Context for container
 * =============================================================================
 */
export const containerContext: ContextDefinition = {
  type: {
    '@id': '@type',
  },
  Container: 'http://www.w3.org/ns/ldp#Container',
  BasicContainer: 'http://www.w3.org/ns/ldp#BasicContainer',
  contains: {
    '@id': 'http://www.w3.org/ns/ldp#contains',
    '@type': '@id',
    '@container': '@set',
  },
  Resource: 'http://www.w3.org/ns/ldp#Resource',
  modified: {
    '@id': 'http://purl.org/dc/terms/modified',
    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
  },
  mtime: {
    '@id': 'http://www.w3.org/ns/posix/stat#mtime',
    '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
  },
  size: {
    '@id': 'http://www.w3.org/ns/posix/stat#size',
    '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
  },
}
