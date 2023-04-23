import { Schema } from 'shexj'

/**
 * =============================================================================
 * hospexGroupSchema: ShexJ Schema for hospexGroup
 * =============================================================================
 */
export const hospexGroupSchema: Schema = {
  type: 'Schema',
  shapes: [
    {
      id: 'https://example.com/HospexGroup',
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
                values: ['http://www.w3.org/2006/vcard/ns#Group'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              valueExpr: {
                type: 'NodeConstraint',
                values: ['http://rdfs.org/sioc/ns#Usergroup'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://rdfs.org/sioc/ns#usergroup_of',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2006/vcard/ns#hasMember',
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
