import { Schema } from 'shexj'

/**
 * =============================================================================
 * publicTypeIndexSchema: ShexJ Schema for publicTypeIndex
 * =============================================================================
 */
export const publicTypeIndexSchema: Schema = {
  type: 'Schema',
  shapes: [
    {
      id: 'https://example.com/PublicTypeIndex',
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
                values: ['http://www.w3.org/ns/solid/terms#TypeIndex'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              valueExpr: {
                type: 'NodeConstraint',
                values: ['http://www.w3.org/ns/solid/terms#ListedDocument'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://purl.org/dc/terms/references',
              valueExpr: 'https://example.com/TypeRegistration',
              min: 0,
              max: -1,
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
    {
      id: 'https://example.com/TypeRegistration',
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
                values: ['http://www.w3.org/ns/solid/terms#TypeRegistration'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/solid/terms#forClass',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 1,
              max: -1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/solid/terms#instance',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 0,
              max: -1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/solid/terms#instanceContainer',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 0,
              max: -1,
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
  ],
}
