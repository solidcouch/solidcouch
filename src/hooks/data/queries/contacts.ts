import { ldhop } from '@ldhop/core'
import { as, foaf, ldp, rdf, rdfs } from 'rdf-namespaces'
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
