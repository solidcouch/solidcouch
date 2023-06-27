import { Schema } from 'shexj'

/**
 * =============================================================================
 * appSchema: ShexJ Schema for app
 * =============================================================================
 */
export const appSchema: Schema = {
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
              valueExpr: 'https://example.com/Inbox',
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
              valueExpr: 'https://example.com/PrivateTypeIndex',
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
              valueExpr: 'https://example.com/PublicTypeIndex',
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
    {
      id: 'https://example.com/FoafProfile',
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
              predicate: 'http://xmlns.com/foaf/0.1/knows',
              valueExpr: 'https://example.com/FoafProfile',
              min: 0,
              max: -1,
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value:
                      'A list of WebIds for all the people this user knows.',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://xmlns.com/foaf/0.1/topic_interest',
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
                    value: "A list of person's interests.",
                  },
                },
              ],
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
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
              predicate: 'http://www.w3.org/2006/vcard/ns#note',
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
                    value: 'Text about person, in different languages',
                  },
                },
              ],
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
              valueExpr: 'https://example.com/Accommodation',
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
            {
              type: 'TripleConstraint',
              predicate: 'http://rdfs.org/sioc/ns#member_of',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://w3id.org/hospex/ns#storage',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
            },
          ],
        },
      },
    },
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
              valueExpr: 'https://example.com/HospexProfile',
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
      id: 'https://example.com/PrivateTypeIndex',
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
                values: ['http://www.w3.org/ns/solid/terms#UnlistedDocument'],
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
              predicate: 'http://www.w3.org/ns/solid/terms#instance',
              valueExpr: 'https://example.com/ChatShape',
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
    {
      id: 'https://example.com/ChatShape',
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
                values: ['http://www.w3.org/ns/pim/meeting#LongChat'],
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'Defines the type of the chat as a LongChat',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://purl.org/dc/elements/1.1/author',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'The WebId of the entity that created this chat',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://purl.org/dc/elements/1.1/created',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#dateTime',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'The date and time the chat was created',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://purl.org/dc/elements/1.1/title',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#string',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'The title of the chat',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2005/01/wf/flow#participation',
              valueExpr: 'https://example.com/ChatParticipationShape',
              min: 0,
              max: -1,
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'A list of people participating in this chat',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/ui#sharedPreferences',
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
                    value: 'Chat preferences',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2005/01/wf/flow#message',
              valueExpr: 'https://example.com/ChatMessageShape',
              min: 0,
              max: -1,
            },
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
    {
      id: 'https://example.com/ChatParticipationShape',
      type: 'ShapeDecl',
      shapeExpr: {
        type: 'Shape',
        expression: {
          type: 'EachOf',
          expressions: [
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2002/12/cal/ical#dtstart',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#dateTime',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value:
                      'The date and time this individual began participating in the chat.',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/2005/01/wf/flow#participant',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'The WebId of the participant',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/ui#backgroundColor',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#string',
              },
              min: 0,
              max: 1,
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value:
                      "The background color of the participant's chat bubbles",
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://purl.org/dc/terms/references',
              valueExpr: 'https://example.com/ChatShape',
              min: 0,
              max: -1,
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'Part of this chat belonging to this participant',
                  },
                },
              ],
            },
          ],
        },
      },
    },
    {
      id: 'https://example.com/ChatMessageListShape',
      type: 'ShapeDecl',
      shapeExpr: {
        type: 'Shape',
        expression: {
          type: 'TripleConstraint',
          predicate: 'http://www.w3.org/2005/01/wf/flow#message',
          valueExpr: 'https://example.com/ChatMessageShape',
          min: 0,
          max: -1,
          annotations: [
            {
              type: 'Annotation',
              predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
              object: {
                value: 'A list of messages in the chat',
              },
            },
          ],
        },
      },
    },
    {
      id: 'https://example.com/ChatMessageShape',
      type: 'ShapeDecl',
      shapeExpr: {
        type: 'Shape',
        expression: {
          type: 'EachOf',
          expressions: [
            {
              type: 'TripleConstraint',
              predicate: 'http://purl.org/dc/terms/created',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#dateTime',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'The date and time this message was posted.',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://rdfs.org/sioc/ns#content',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#string',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'The text content of the message',
                  },
                },
              ],
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://xmlns.com/foaf/0.1/maker',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
              annotations: [
                {
                  type: 'Annotation',
                  predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
                  object: {
                    value: 'The WebId of the person who sent the message.',
                  },
                },
              ],
            },
          ],
        },
      },
    },
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
    {
      id: 'https://example.com/Inbox',
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
              valueExpr: 'https://example.com/MessageActivity',
              min: 0,
              max: -1,
            },
            {
              type: 'TripleConstraint',
              predicate: 'http://www.w3.org/ns/ldp#contains',
              valueExpr: 'https://example.com/ContactInvitationActivity',
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
      id: 'https://example.com/MessageActivity',
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
              valueExpr: 'https://example.com/ChatMessageShape',
            },
            {
              type: 'TripleConstraint',
              predicate: 'https://www.w3.org/ns/activitystreams#target',
              valueExpr: 'https://example.com/ChatShape',
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
    {
      id: 'https://example.com/ContactInvitationActivity',
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
                values: ['https://www.w3.org/ns/activitystreams#Invite'],
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
              predicate: 'https://www.w3.org/ns/activitystreams#content',
              valueExpr: {
                type: 'NodeConstraint',
                datatype: 'http://www.w3.org/2001/XMLSchema#string',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'https://www.w3.org/ns/activitystreams#object',
              valueExpr: 'https://example.com/ContactRelationship',
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
    {
      id: 'https://example.com/ContactRelationship',
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
                values: ['https://www.w3.org/ns/activitystreams#Relationship'],
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'https://www.w3.org/ns/activitystreams#subject',
              valueExpr: {
                type: 'NodeConstraint',
                nodeKind: 'iri',
              },
            },
            {
              type: 'TripleConstraint',
              predicate: 'https://www.w3.org/ns/activitystreams#relationship',
              valueExpr: {
                type: 'NodeConstraint',
                values: ['http://xmlns.com/foaf/0.1/knows'],
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
          ],
        },
        extra: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],
      },
    },
  ],
}
