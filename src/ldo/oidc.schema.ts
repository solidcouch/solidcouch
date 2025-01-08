import { Schema } from 'shexj'

/**
 * =============================================================================
 * oidcSchema: ShexJ Schema for oidc
 * =============================================================================
 */
export const oidcSchema: Schema = {
  type: 'Schema',
  shapes: [
    {
      id: 'https://example.com/OidcIssuer',
      type: 'ShapeDecl',
      shapeExpr: {
        type: 'Shape',
        expression: {
          type: 'TripleConstraint',
          predicate: 'http://www.w3.org/ns/solid/terms#oidcIssuer',
          valueExpr: {
            type: 'NodeConstraint',
            nodeKind: 'iri',
          },
          min: 1,
          max: -1,
          annotations: [
            {
              type: 'Annotation',
              predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
              object: {
                value: 'Solid OIDC issuer for a webId.',
              },
            },
          ],
        },
      },
    },
  ],
}
