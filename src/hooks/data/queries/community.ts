import { ldhop } from '@ldhop/core'
import { ldp, sioc, vcard } from 'rdf-namespaces'

export const readCommunityQuery = ldhop('?community')
  .match('?community', sioc.has_usergroup)
  .o('?group')
  .match('?community', ldp.inbox)
  .o('?inbox')

export const readCommunityMembersQuery = readCommunityQuery
  .match('?group', vcard.hasMember)
  .o('?person')
