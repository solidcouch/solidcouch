import type { LdhopQuery } from '@ldhop/core'
import { ldp, sioc, vcard } from 'rdf-namespaces'
import { LdhopQueryVar } from './profile'

export const readCommunityQuery: LdhopQuery<
  '?community' | '?group' | '?inbox'
> = [
  {
    type: 'match',
    subject: '?community',
    predicate: sioc.has_usergroup,
    pick: 'object',
    target: '?group',
  },
  {
    type: 'match',
    subject: '?community',
    predicate: ldp.inbox,
    pick: 'object',
    target: '?inbox',
  },
]

export const readCommunityMembersQuery: LdhopQuery<
  LdhopQueryVar<typeof readCommunityQuery> | '?person'
> = [
  ...readCommunityQuery,
  {
    type: 'match',
    subject: '?group',
    predicate: vcard.hasMember,
    pick: 'object',
    target: '?person',
  },
]
