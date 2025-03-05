import { LdoJsonldContext } from '@ldo/ldo'

/**
 * =============================================================================
 * accommodationContext: JSONLD Context for accommodation
 * =============================================================================
 */
export const accommodationContext: LdoJsonldContext = {
  type: {
    '@id': '@type',
  },
  Accommodation: {
    '@id': 'http://w3id.org/hospex/ns#Accommodation',
    '@context': {
      type: {
        '@id': '@type',
      },
      description: {
        '@id': 'http://purl.org/dc/terms/description',
        '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
        '@isCollection': true,
      },
      location: {
        '@id': 'http://www.w3.org/2003/01/geo/wgs84_pos#location',
        '@type': '@id',
      },
      offeredBy: {
        '@id': 'http://w3id.org/hospex/ns#offeredBy',
        '@type': '@id',
      },
    },
  },
  Accommodation2: {
    '@id': 'https://schema.org/Accommodation',
    '@context': {
      type: {
        '@id': '@type',
      },
      description: {
        '@id': 'http://purl.org/dc/terms/description',
        '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
        '@isCollection': true,
      },
      location: {
        '@id': 'http://www.w3.org/2003/01/geo/wgs84_pos#location',
        '@type': '@id',
      },
      offeredBy: {
        '@id': 'http://w3id.org/hospex/ns#offeredBy',
        '@type': '@id',
      },
    },
  },
  description: {
    '@id': 'http://purl.org/dc/terms/description',
    '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
    '@isCollection': true,
  },
  location: {
    '@id': 'http://www.w3.org/2003/01/geo/wgs84_pos#location',
    '@type': '@id',
  },
  Point: {
    '@id': 'http://www.w3.org/2003/01/geo/wgs84_pos#Point',
    '@context': {
      type: {
        '@id': '@type',
      },
      lat: {
        '@id': 'http://www.w3.org/2003/01/geo/wgs84_pos#lat',
        '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
      },
      long: {
        '@id': 'http://www.w3.org/2003/01/geo/wgs84_pos#long',
        '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
      },
    },
  },
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
