import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * longChatContext: JSONLD Context for longChat
 * =============================================================================
 */
export const longChatContext: ContextDefinition = {
  type: {
    '@id': '@type',
  },
  LongChat: 'http://www.w3.org/ns/pim/meeting#LongChat',
  author: {
    '@id': 'http://purl.org/dc/elements/1.1/author',
    '@type': '@id',
  },
  created: {
    '@id': 'http://purl.org/dc/elements/1.1/created',
    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
  },
  title: {
    '@id': 'http://purl.org/dc/elements/1.1/title',
    '@type': 'http://www.w3.org/2001/XMLSchema#string',
  },
  participation: {
    '@id': 'http://www.w3.org/2005/01/wf/flow#participation',
    '@type': '@id',
    '@container': '@set',
  },
  dtstart: {
    '@id': 'http://www.w3.org/2002/12/cal/ical#dtstart',
    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
  },
  participant: {
    '@id': 'http://www.w3.org/2005/01/wf/flow#participant',
    '@type': '@id',
  },
  backgroundColor: {
    '@id': 'http://www.w3.org/ns/ui#backgroundColor',
    '@type': 'http://www.w3.org/2001/XMLSchema#string',
  },
  references: {
    '@id': 'http://purl.org/dc/terms/references',
    '@type': '@id',
  },
  sharedPreferences: {
    '@id': 'http://www.w3.org/ns/ui#sharedPreferences',
    '@type': '@id',
  },
  message: {
    '@id': 'http://www.w3.org/2005/01/wf/flow#message',
    '@type': '@id',
    '@container': '@set',
  },
  created2: {
    '@id': 'http://purl.org/dc/terms/created',
    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
  },
  content: {
    '@id': 'http://rdfs.org/sioc/ns#content',
    '@type': 'http://www.w3.org/2001/XMLSchema#string',
  },
  maker: {
    '@id': 'http://xmlns.com/foaf/0.1/maker',
    '@type': '@id',
  },
}
