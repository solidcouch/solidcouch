import { RdfQuery } from '@ldhop/core'
import { dct, sioc, solid, vcard } from 'rdf-namespaces'
import { hospex, rdfs, space } from 'utils/rdf-namespaces'

// find person and their profile documents
// https://solid.github.io/webid-profile/#discovery
export const webIdProfileQuery: RdfQuery = [
  {
    type: 'match',
    subject: '?person',
    predicate: rdfs.seeAlso, // TODO also include foaf.isPrimaryTopicOf
    pick: 'object',
    target: '?profileDocument',
  },
  // fetch the profile documents
  { type: 'add resources', variable: '?profileDocument' },
  // find and fetch preferences file
  // https://solid.github.io/webid-profile/#discovery
  {
    type: 'match',
    subject: '?person',
    predicate: space.preferencesFile,
    pick: 'object',
    target: '?preferencesFile',
  },
  { type: 'add resources', variable: '?preferencesFile' },
  // find and fetch private type index
  {
    type: 'match',
    subject: '?person',
    predicate: solid.privateTypeIndex,
    pick: 'object',
    target: '?privateTypeIndex',
  },
  // find public type index
  {
    type: 'match',
    subject: '?person',
    predicate: solid.publicTypeIndex,
    pick: 'object',
    target: '?publicTypeIndex',
  },
]

// in public type index, find all personal hospex documents of the person for a particular community, and fetch them
export const hospexDocumentQuery: RdfQuery = [
  ...webIdProfileQuery,
  {
    type: 'match',
    subject: '?publicTypeIndex',
    predicate: dct.references,
    pick: 'object',
    target: '?typeRegistration',
  },
  {
    type: 'match',
    subject: '?typeRegistration',
    predicate: solid.forClass,
    object: hospex.PersonalHospexDocument,
    pick: 'subject',
    target: '?typeRegistrationForHospex',
  },
  {
    type: 'match',
    subject: '?typeRegistrationForHospex',
    predicate: solid.instance,
    pick: 'object',
    target: `?hospexDocument`,
  },
  { type: 'add resources', variable: '?hospexDocument' },
  {
    type: 'match',
    subject: '?person',
    predicate: sioc.member_of,
    object: '?community',
    pick: 'graph',
    target: '?hospexDocumentForCommunity',
  },
  {
    type: 'match',
    subject: '?person',
    predicate: space.preferencesFile,
    graph: '?hospexDocumentForCommunity',
    pick: 'object',
    target: '?hospexSettings',
  },
]

export const readPersonAccommodationsQuery: RdfQuery = [
  ...hospexDocumentQuery,
  {
    type: 'match',
    subject: '?person',
    predicate: hospex.offers,
    graph: '?hospexDocumentForCommunity',
    pick: 'object',
    target: '?offer',
  },
  { type: 'add resources', variable: '?offer' },
]

/**
 * Fetch hosting offers from all community members
 * TODO there are security checks missing
 * we should make sure that accommodation is offered by the user who offers it (check both directions of the relationship)
 */
export const searchAccommodationsQuery: RdfQuery = [
  {
    type: 'match',
    subject: '?community',
    predicate: sioc.has_usergroup,
    pick: 'object',
    target: '?group',
  },
  {
    type: 'match',
    subject: '?group',
    predicate: vcard.hasMember,
    pick: 'object',
    target: '?person',
  },
  ...readPersonAccommodationsQuery,
]
