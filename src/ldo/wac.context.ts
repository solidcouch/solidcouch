import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * wacContext: JSONLD Context for wac
 * =============================================================================
 */
export const wacContext: ContextDefinition = {
  type: {
    '@id': '@type',
  },
  Authorization: 'http://www.w3.org/ns/auth/acl#Authorization',
  accessTo: {
    '@id': 'http://www.w3.org/ns/auth/acl#accessTo',
    '@type': '@id',
    '@container': '@set',
  },
  default: {
    '@id': 'http://www.w3.org/ns/auth/acl#default',
    '@type': '@id',
  },
  agent: {
    '@id': 'http://www.w3.org/ns/auth/acl#agent',
    '@type': '@id',
    '@container': '@set',
  },
  agentClass: {
    '@id': 'http://www.w3.org/ns/auth/acl#agentClass',
    '@type': '@id',
    '@container': '@set',
  },
  agentGroup: {
    '@id': 'http://www.w3.org/ns/auth/acl#agentGroup',
    '@type': '@id',
    '@container': '@set',
  },
  mode: {
    '@id': 'http://www.w3.org/ns/auth/acl#mode',
    '@type': '@id',
    '@container': '@set',
  },
  Read: 'http://www.w3.org/ns/auth/acl#Read',
  Write: 'http://www.w3.org/ns/auth/acl#Write',
  Control: 'http://www.w3.org/ns/auth/acl#Control',
  Append: 'http://www.w3.org/ns/auth/acl#Append',
  origin: {
    '@id': 'http://www.w3.org/ns/auth/acl#origin',
    '@type': '@id',
    '@container': '@set',
  },
}
