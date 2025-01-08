import { Schema } from 'shexj'

/**
 * =============================================================================
 * hospexProfileSchema: ShexJ Schema for hospexProfile
 * =============================================================================
 */
export const hospexProfileSchema: Schema = {
  type: 'Schema',
  shapes: [
    {
      id: 'https://example.com/HospexProfile',
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
                values: ['http://xmlns.com/foaf/0.1/Person'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2006/vcard/ns#note',
              valueExpr: {
                type: 'NodeConstraint',
                datatype:
                  'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
              },
              min: 0,
              max: -1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://xmlns.com/foaf/0.1/name',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#string',
              },
              min: 0,
              max: 1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2006/vcard/ns#hasPhoto',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 0,
              max: 1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://w3id.org/hospex/ns#offers',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 0,
              max: -1,
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'Accommodation that the person offers',
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
