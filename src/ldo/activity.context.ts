import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * activityContext: JSONLD Context for activity
 * =============================================================================
 */
export const activityContext: ContextDefinition = {
  type: {
    '@id': '@type',
  },
  Add: 'https://www.w3.org/ns/activitystreams#Add',
  actor: {
    '@id': 'https://www.w3.org/ns/activitystreams#actor',
    '@type': '@id',
  },
  context: {
    '@id': 'https://www.w3.org/ns/activitystreams#context',
    '@type': '@id',
  },
  object: {
    '@id': 'https://www.w3.org/ns/activitystreams#object',
    '@type': '@id',
  },
  target: {
    '@id': 'https://www.w3.org/ns/activitystreams#target',
    '@type': '@id',
  },
  updated: {
    '@id': 'https://www.w3.org/ns/activitystreams#updated',
    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
  },
}
