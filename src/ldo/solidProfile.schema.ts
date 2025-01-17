import { Schema } from 'shexj'

/**
 * =============================================================================
 * solidProfileSchema: ShexJ Schema for solidProfile
 * =============================================================================
 */
export const solidProfileSchema: Schema = {
  type: 'Schema',
  shapes: [
    {
      id: 'https://example.com/SolidProfile',
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
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'Defines the node as a Person (from foaf)',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/ldp#inbox',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value:
                      "The user's LDP inbox to which apps can post notifications",
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/pim/space#preferencesFile',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 0,
              max: 1,
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: "The user's preferences",
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/pim/space#storage',
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
                    value:
                      'The location of a Solid storage server related to this WebId',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/solid/terms#account',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 0,
              max: 1,
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: "The user's account",
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/solid/terms#privateTypeIndex',
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
                    value:
                      "A registry of all types used on the user's Pod (for private access only)",
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/solid/terms#publicTypeIndex',
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
                    value:
                      "A registry of all types used on the user's Pod (for public access)",
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
