import { hospex } from '@/utils/rdf-namespaces'
import type { LdhopQuery } from '@ldhop/core'
import { rdf, sioc, solid, space } from 'rdf-namespaces'
import {
  LdhopQueryVars,
  personInbox,
  publicWebIdProfileQuery,
  webIdProfileQuery,
} from './profile'

// in public type index, find all personal hospex documents of the person for a particular community, and fetch them
const partialHospexDocumentQuery: LdhopQuery<
  | '?publicTypeIndex'
  | '?typeRegistration'
  | '?typeRegistrationForHospex'
  | '?hospexDocument'
  | '?person'
  | '?community'
  | '?hospexDocumentForCommunity'
> = [
  {
    type: 'match',
    predicate: rdf.type,
    object: solid.TypeRegistration,
    graph: '?publicTypeIndex',
    pick: 'subject',
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

export const hospexDocumentQuery: LdhopQuery<
  | LdhopQueryVars<typeof publicWebIdProfileQuery>
  | LdhopQueryVars<typeof partialHospexDocumentQuery>
> = [...publicWebIdProfileQuery, ...partialHospexDocumentQuery]

export const privateProfileAndHospexDocumentQuery: LdhopQuery<
  | LdhopQueryVars<typeof webIdProfileQuery>
  | LdhopQueryVars<typeof partialHospexDocumentQuery>
  | '?hospexSettings'
  | '?eachCommunity'
  | '?communityName'
> = [
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

export const emailVerificationQuery: LdhopQuery<
  | LdhopQueryVars<typeof hospexDocumentQuery>
  | '?hospexPreferencesFile'
  | '?emailVerificationToken'
> = [
  ...hospexDocumentQuery,
  {
    type: 'match',
    subject: '?person',
    predicate: space.preferencesFile,
    graph: '?hospexDocumentForCommunity',
    pick: 'object',
    target: '?hospexPreferencesFile',
  },
  {
    type: 'match',
    pick: 'object',
    subject: '?person',
    predicate: 'https://example.com/emailVerificationToken',
    graph: '?hospexPreferencesFile',
    target: '?emailVerificationToken',
  },
]
