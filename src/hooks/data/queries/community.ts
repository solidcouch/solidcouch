import { ldhop } from '@ldhop/core'
import * as ldp from 'rdf-namespaces/ldp'
import * as sioc from 'rdf-namespaces/sioc'
import * as vcard from 'rdf-namespaces/vcard'

export const readCommunityQuery = ldhop('?community')
  .match('?community', sioc.has_usergroup)
  .o('?group')
  .match('?community', ldp.inbox)
  .o('?inbox')

export const readCommunityMembersQuery = readCommunityQuery
  .match('?group', vcard.hasMember)
  .o('?person')
