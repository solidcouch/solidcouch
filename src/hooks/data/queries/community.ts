import type { RdfQuery } from '@ldhop/core'
import { sioc, vcard } from 'rdf-namespaces'

export const readCommunityQuery: RdfQuery = [
  {
    type: 'match',
    subject: '?community',
    predicate: sioc.has_usergroup,
    pick: 'object',
    target: '?group',
  },
]

export const readCommunityMembersQuery: RdfQuery = [
  ...readCommunityQuery,
  {
    type: 'match',
    subject: '?group',
    predicate: vcard.hasMember,
    pick: 'object',
    target: '?person',
  },
]
