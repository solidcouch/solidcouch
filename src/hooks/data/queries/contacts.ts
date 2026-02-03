import { ldhop } from '@ldhop/core'
import * as as from 'rdf-namespaces/as'
import * as foaf from 'rdf-namespaces/foaf'
import * as ldp from 'rdf-namespaces/ldp'
import * as rdf from 'rdf-namespaces/rdf'
import * as rdfs from 'rdf-namespaces/rdfs'
import { personInbox, profileDocuments } from './profile'

export const contactsQuery = ldhop()
  .concat(profileDocuments)
  .match('?person', foaf.knows)
  .o('?otherPerson')
  .match('?otherPerson', rdfs.seeAlso) // TODO also include foaf.isPrimaryTopicOf
  .o('?otherProfileDocument')
  // fetch the profile documents
  .add()

export const contactRequestsQuery = ldhop()
  .concat(profileDocuments)
  .concat([personInbox])
  .match('?inbox', ldp.contains)
  .o('?notification')
  .match('?notification', rdf.type, as.Invite)
  .s('?inviteNotification')
