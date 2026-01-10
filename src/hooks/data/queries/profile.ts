import { ldhop, type Match } from '@ldhop/core'
import { ldp, rdfs, solid, space } from 'rdf-namespaces'

export const personInbox: Match<'?person' | '?inbox'> = {
  type: 'match',
  subject: '?person',
  predicate: ldp.inbox,
  pick: 'object',
  target: '?inbox',
}

export const profileDocuments = ldhop('?person')
  .match('?person', rdfs.seeAlso)
  .o('?profileDocument')
  .add()

export const publicWebIdProfileQuery = profileDocuments
  .match('?person', solid.publicTypeIndex)
  .o('?publicTypeIndex')

// find person and their profile documents
// https://solid.github.io/webid-profile/#discovery
export const webIdProfileQuery = publicWebIdProfileQuery
  .match('?person', space.preferencesFile)
  .o('?preferencesFile')
  .add()
  .match('?person', solid.privateTypeIndex)
  .o('?privateTypeIndex')
  .match('?person', ldp.inbox)
  .o('?inbox')
