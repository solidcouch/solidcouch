import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * appContext: JSONLD Context for app
 * =============================================================================
 */
export const appContext: ContextDefinition = {
  type: {
    '@id': '@type',
  },
  Person: 'http://xmlns.com/foaf/0.1/Person',
  inbox: {
    '@id': 'http://www.w3.org/ns/ldp#inbox',
    '@type': '@id',
  },
  Container: 'http://www.w3.org/ns/ldp#Container',
  BasicContainer: 'http://www.w3.org/ns/ldp#BasicContainer',
  contains: {
    '@id': 'http://www.w3.org/ns/ldp#contains',
    '@type': '@id',
    '@container': '@set',
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
  created: {
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
  target: {
    '@id': 'https://www.w3.org/ns/activitystreams#target',
    '@type': '@id',
  },
  LongChat: 'http://www.w3.org/ns/pim/meeting#LongChat',
  author: {
    '@id': 'http://purl.org/dc/elements/1.1/author',
    '@type': '@id',
  },
  created2: {
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
    '@container': '@set',
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
  updated: {
    '@id': 'https://www.w3.org/ns/activitystreams#updated',
    '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
  },
  Invite: 'https://www.w3.org/ns/activitystreams#Invite',
  content2: {
    '@id': 'https://www.w3.org/ns/activitystreams#content',
    '@type': 'http://www.w3.org/2001/XMLSchema#string',
  },
  Relationship: 'https://www.w3.org/ns/activitystreams#Relationship',
  subject: {
    '@id': 'https://www.w3.org/ns/activitystreams#subject',
    '@type': '@id',
  },
  relationship: {
    '@id': 'https://www.w3.org/ns/activitystreams#relationship',
  },
  knows: {
    '@id': 'http://xmlns.com/foaf/0.1/knows',
    '@type': '@id',
    '@container': '@set',
  },
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
  publicTypeIndex: {
    '@id': 'http://www.w3.org/ns/solid/terms#publicTypeIndex',
    '@type': '@id',
    '@container': '@set',
  },
  ListedDocument: 'http://www.w3.org/ns/solid/terms#ListedDocument',
  oidcIssuer: {
    '@id': 'http://www.w3.org/ns/solid/terms#oidcIssuer',
    '@type': '@id',
    '@container': '@set',
  },
  topicInterest: {
    '@id': 'http://xmlns.com/foaf/0.1/topic_interest',
    '@type': '@id',
    '@container': '@set',
  },
  note: {
    '@id': 'http://www.w3.org/2006/vcard/ns#note',
    '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
    '@container': '@set',
  },
  name: {
    '@id': 'http://xmlns.com/foaf/0.1/name',
    '@type': 'http://www.w3.org/2001/XMLSchema#string',
  },
  hasPhoto: {
    '@id': 'http://www.w3.org/2006/vcard/ns#hasPhoto',
    '@type': '@id',
  },
  offers: {
    '@id': 'http://w3id.org/hospex/ns#offers',
    '@type': '@id',
    '@container': '@set',
  },
  Accommodation: 'http://w3id.org/hospex/ns#Accommodation',
  Accommodation2: 'https://schema.org/Accommodation',
  description: {
    '@id': 'http://purl.org/dc/terms/description',
    '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
    '@container': '@set',
  },
  location: {
    '@id': 'http://www.w3.org/2003/01/geo/wgs84_pos#location',
    '@type': '@id',
  },
  Point: 'http://www.w3.org/2003/01/geo/wgs84_pos#Point',
  lat: {
    '@id': 'http://www.w3.org/2003/01/geo/wgs84_pos#lat',
    '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
  },
  long: {
    '@id': 'http://www.w3.org/2003/01/geo/wgs84_pos#long',
    '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
  },
  offeredBy: {
    '@id': 'http://w3id.org/hospex/ns#offeredBy',
    '@type': '@id',
  },
  memberOf: {
    '@id': 'http://rdfs.org/sioc/ns#member_of',
    '@type': '@id',
    '@container': '@set',
  },
  storage2: {
    '@id': 'http://w3id.org/hospex/ns#storage',
    '@type': '@id',
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
  instanceContainer: {
    '@id': 'http://www.w3.org/ns/solid/terms#instanceContainer',
    '@type': '@id',
    '@container': '@set',
  },
  Resource: 'http://www.w3.org/ns/ldp#Resource',
}
