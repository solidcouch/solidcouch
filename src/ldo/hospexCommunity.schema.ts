import { Schema } from 'shexj'

/**
 * =============================================================================
 * hospexCommunitySchema: ShexJ Schema for hospexCommunity
 * =============================================================================
 */
export const hospexCommunitySchema: Schema = {
  type: 'Schema',
  shapes: [
    {
      id: 'https://example.com/HospexCommunity',
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
                values: ['http://w3id.org/hospex/ns#Community'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              valueExpr: {
                type: 'NodeConstraint',
                values: ['http://rdfs.org/sioc/ns#Community'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://rdfs.org/sioc/ns#name',
              valueExpr: {
                type: 'NodeConstraint',
                datatype:
                  'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
              },
              min: 1,
              max: -1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://rdfs.org/sioc/ns#about',
              valueExpr: {
                type: 'NodeConstraint',
                datatype:
                  'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
              },
              min: 1,
              max: -1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://rdfs.org/sioc/ns#has_usergroup',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 1,
              max: -1,
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
  ],
}
