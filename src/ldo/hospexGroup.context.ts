import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * hospexGroupContext: JSONLD Context for hospexGroup
 * =============================================================================
 */
export const hospexGroupContext: ContextDefinition = {
  type: {
    '@id': '@type',
    '@container': '@set',
  },
  Group: 'http://www.w3.org/2006/vcard/ns#Group',
  Usergroup: 'http://rdfs.org/sioc/ns#Usergroup',
  usergroupOf: {
    '@id': 'http://rdfs.org/sioc/ns#usergroup_of',
    '@type': '@id',
  },
  hasMember: {
    '@id': 'http://www.w3.org/2006/vcard/ns#hasMember',
    '@type': '@id',
    '@container': '@set',
  },
}
