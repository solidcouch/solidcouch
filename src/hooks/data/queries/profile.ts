import type { Match, RdfQuery } from '@ldhop/core'
import { ldp, solid } from 'rdf-namespaces'
import { rdfs, space } from '../../../utils/rdf-namespaces'

export const personInbox: Match = {
  type: 'match',
  subject: '?person',
  predicate: ldp.inbox,
  pick: 'object',
  target: '?inbox',
}

export const profileDocuments: RdfQuery = [
  {
    type: 'match',
    subject: '?person',
    predicate: rdfs.seeAlso, // TODO also include foaf.isPrimaryTopicOf
    pick: 'object',
    target: '?profileDocument',
  },
  // fetch the profile documents
  { type: 'add resources', variable: '?profileDocument' },
]

export const publicWebIdProfileQuery: RdfQuery = [
  ...profileDocuments,
  // find public type index
  {
    type: 'match',
    subject: '?person',
    predicate: solid.publicTypeIndex,
    pick: 'object',
    target: '?publicTypeIndex',
  },
]

// find person and their profile documents
// https://solid.github.io/webid-profile/#discovery
export const webIdProfileQuery: RdfQuery = [
  ...publicWebIdProfileQuery,
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
  personInbox,
]
