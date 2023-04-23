import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * hospexCommunityContext: JSONLD Context for hospexCommunity
 * =============================================================================
 */
export const hospexCommunityContext: ContextDefinition = {
  type: {
    '@id': '@type',
    '@container': '@set',
  },
  Community: 'http://w3id.org/hospex/ns#Community',
  Community2: 'http://rdfs.org/sioc/ns#Community',
  name: {
    '@id': 'http://rdfs.org/sioc/ns#name',
    '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
    '@container': '@set',
  },
  about: {
    '@id': 'http://rdfs.org/sioc/ns#about',
    '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
    '@container': '@set',
  },
  hasUsergroup: {
    '@id': 'http://rdfs.org/sioc/ns#has_usergroup',
    '@type': '@id',
    '@container': '@set',
  },
}
