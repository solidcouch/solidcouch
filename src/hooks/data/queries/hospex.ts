import type { RdfQuery } from '@ldhop/core'
import { dct, sioc, solid } from 'rdf-namespaces'
import { hospex, space } from '../../../utils/rdf-namespaces'
import {
  personInbox,
  publicWebIdProfileQuery,
  webIdProfileQuery,
} from './profile'

// in public type index, find all personal hospex documents of the person for a particular community, and fetch them
const partialHospexDocumentQuery: RdfQuery = [
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
]

export const hospexDocumentQuery: RdfQuery = [
  ...publicWebIdProfileQuery,
  ...partialHospexDocumentQuery,
]

// eslint-disable-next-line import/no-unused-modules
export const privateProfileAndHospexDocumentQuery: RdfQuery = [
  ...webIdProfileQuery,
  ...partialHospexDocumentQuery,
  {
    type: 'match',
    subject: '?person',
    predicate: space.preferencesFile,
    graph: '?hospexDocumentForCommunity',
    pick: 'object',
    target: '?hospexSettings',
  },
  personInbox,
  // get all communities that are set up
  {
    type: 'match',
    subject: '?person',
    predicate: sioc.member_of,
    pick: 'object',
    target: '?eachCommunity',
  },
  {
    type: 'match',
    subject: '?eachCommunity',
    predicate: sioc.name,
    pick: 'object',
    target: '?communityName',
  },
]
