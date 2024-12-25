import type { Schema } from 'shexj'

/**
 * =============================================================================
 * containerSchema: ShexJ Schema for container
 * =============================================================================
 */
export const containerSchema: Schema = {
  type: 'Schema',
  shapes: [
    {
      id: 'https://example.com/Container',
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
                values: ['http://www.w3.org/ns/ldp#Container'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              valueExpr: {
                type: 'NodeConstraint',
                values: ['http://www.w3.org/ns/ldp#BasicContainer'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/ldp#contains',
              valueExpr: 'https://example.com/Resource',
              min: 0,
              max: -1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/ldp#contains',
              valueExpr: 'https://example.com/Container',
              min: 0,
              max: -1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://purl.org/dc/terms/modified',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#dateTime',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/posix/stat#mtime',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#decimal',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/posix/stat#size',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#decimal',
              },
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
    {
      id: 'https://example.com/Resource',
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
                values: ['http://www.w3.org/ns/ldp#Resource'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://purl.org/dc/terms/modified',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#dateTime',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/posix/stat#mtime',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#decimal',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/posix/stat#size',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#decimal',
              },
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
  ],
}
