import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * appContext: JSONLD Context for app
 * =============================================================================
 */
export const appContext: ContextDefinition = {
  type: {
    '@id': '@type',
    '@container': '@set',
  },
  Person: 'http://xmlns.com/foaf/0.1/Person',
  inbox: {
    '@id': 'http://www.w3.org/ns/ldp#inbox',
    '@type': '@id',
  },
  preferencesFile: {
    '@id': 'http://www.w3.org/ns/pim/space#preferencesFile',
    '@type': '@id',
  },
  storage: {
    '@id': 'http://www.w3.org/ns/pim/space#storage',
    '@type': '@id',
    '@container': '@set',
  },
  account: {
    '@id': 'http://www.w3.org/ns/solid/terms#account',
    '@type': '@id',
  },
  privateTypeIndex: {
    '@id': 'http://www.w3.org/ns/solid/terms#privateTypeIndex',
    '@type': '@id',
    '@container': '@set',
  },
  TypeIndex: 'http://www.w3.org/ns/solid/terms#TypeIndex',
  UnlistedDocument: 'http://www.w3.org/ns/solid/terms#UnlistedDocument',
  references: {
    '@id': 'http://purl.org/dc/terms/references',
    '@type': '@id',
    '@container': '@set',
  },
  TypeRegistration: 'http://www.w3.org/ns/solid/terms#TypeRegistration',
  forClass: {
    '@id': 'http://www.w3.org/ns/solid/terms#forClass',
    '@type': '@id',
    '@container': '@set',
  },
  instance: {
    '@id': 'http://www.w3.org/ns/solid/terms#instance',
    '@type': '@id',
    '@container': '@set',
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
  instanceContainer: {
    '@id': 'http://www.w3.org/ns/solid/terms#instanceContainer',
    '@type': '@id',
    '@container': '@set',
  },
  publicTypeIndex: {
    '@id': 'http://www.w3.org/ns/solid/terms#publicTypeIndex',
    '@type': '@id',
    '@container': '@set',
  },
  ListedDocument: 'http://www.w3.org/ns/solid/terms#ListedDocument',
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
    '@container': '@set',
  },
  mtime: {
    '@id': 'http://www.w3.org/ns/posix/stat#mtime',
    '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
    '@container': '@set',
  },
  size: {
    '@id': 'http://www.w3.org/ns/posix/stat#size',
    '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
    '@container': '@set',
  },
}
