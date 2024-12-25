import { as, rdfs } from '@/utils/rdf-namespaces'
import type { RdfQuery } from '@ldhop/core'
import { foaf, ldp, rdf } from 'rdf-namespaces'
import { personInbox, profileDocuments } from './profile'

export const contactsQuery: RdfQuery = [
  ...profileDocuments,
  {
    type: 'match',
    subject: '?person',
    predicate: foaf.knows,
    pick: 'object',
    target: '?otherPerson',
  },
  {
    type: 'match',
    subject: '?otherPerson',
    predicate: rdfs.seeAlso, // TODO also include foaf.isPrimaryTopicOf
    pick: 'object',
    target: '?otherProfileDocument',
  },
  // fetch the profile documents
  { type: 'add resources', variable: '?otherProfileDocument' },
]

export const contactRequestsQuery: RdfQuery = [
  ...profileDocuments,
  personInbox,
  {
    type: 'match',
    subject: '?inbox',
    predicate: ldp.contains,
    pick: 'object',
    target: '?notification',
  },
  {
    type: 'match',
    subject: '?notification',
    predicate: rdf.type,
    object: as.Invite,
    pick: 'subject',
    target: '?inviteNotification',
  },
]
