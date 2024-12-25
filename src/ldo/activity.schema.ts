import type { Schema } from 'shexj'

/**
 * =============================================================================
 * activitySchema: ShexJ Schema for activity
 * =============================================================================
 */
export const activitySchema: Schema = {
  type: 'Schema',
  shapes: [
    {
      id: 'https://example.com/Activity',
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
                values: ['https://www.w3.org/ns/activitystreams#Add'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'https://www.w3.org/ns/activitystreams#actor',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'https://www.w3.org/ns/activitystreams#context',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'https://www.w3.org/ns/activitystreams#object',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'https://www.w3.org/ns/activitystreams#target',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'https://www.w3.org/ns/activitystreams#updated',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#dateTime',
              },
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
  ],
}
