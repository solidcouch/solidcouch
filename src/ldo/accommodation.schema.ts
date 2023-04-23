import { Schema } from 'shexj'

/**
 * =============================================================================
 * accommodationSchema: ShexJ Schema for accommodation
 * =============================================================================
 */
export const accommodationSchema: Schema = {
  type: 'Schema',
  shapes: [
    {
      id: 'https://example.com/Accommodation',
      type: 'ShapeDecl',
      shapeExpr: {
        type: 'Shape',
        expression: {
          type: 'EachOf',
          expressions: [
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              valueExpr: {
                type: 'NodeConstraint',
                values: ['http://w3id.org/hospex/ns#Accommodation'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              valueExpr: {
                type: 'NodeConstraint',
                values: ['https://schema.org/Accommodation'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://purl.org/dc/terms/description',
              valueExpr: {
                type: 'NodeConstraint',
                datatype:
                  'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
              },
              min: 0,
              max: -1,
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'Text about the accommodation',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2003/01/geo/wgs84_pos#location',
              valueExpr: 'https://example.com/Point',
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'Location of the accommodation',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://w3id.org/hospex/ns#offeredBy',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
    {
      id: 'https://example.com/Point',
      type: 'ShapeDecl',
      shapeExpr: {
        type: 'Shape',
        expression: {
          type: 'EachOf',
          expressions: [
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              valueExpr: {
                type: 'NodeConstraint',
                values: ['http://www.w3.org/2003/01/geo/wgs84_pos#Point'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2003/01/geo/wgs84_pos#lat',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#decimal',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'Latitude of the location in WGS84',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2003/01/geo/wgs84_pos#long',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#decimal',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'Longitude of the location in WGS84',
                  },
                },
              ],
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
  ],
}
