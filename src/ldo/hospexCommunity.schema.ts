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
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'Name of the community. One name per language.',
                  },
                },
              ],
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
              predicate: 'http://rdfs.org/sioc/ns#note',
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
                    value: 'A teaser, tagline, pun for the community',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://xmlns.com/foaf/0.1/logo',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 0,
              max: 2,
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value:
                      'Logo of the community. If two are specified, the second one may be used for highlight of the first one',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://xmlns.com/foaf/0.1/homepage',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              min: 0,
              max: 1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://rdfs.org/sioc/ns#has_usergroup',
              valueExpr: 'https://example.com/HospexGroup',
              min: 1,
              max: -1,
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
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
