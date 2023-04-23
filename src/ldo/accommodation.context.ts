import { ContextDefinition } from 'jsonld'

/**
 * =============================================================================
 * accommodationContext: JSONLD Context for accommodation
 * =============================================================================
 */
export const accommodationContext: ContextDefinition = {
  type: {
    '@id': '@type',
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
}
