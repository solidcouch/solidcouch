import type { LdhopQuery } from '@ldhop/core'
import { as, foaf, ldp, rdf, rdfs } from 'rdf-namespaces'
import {
  LdhopQueryVars,
  MatchVar,
  personInbox,
  profileDocuments,
} from './profile'

export const contactsQuery: LdhopQuery<
  | LdhopQueryVars<typeof profileDocuments>
  | '?otherPerson'
  | '?otherProfileDocument'
> = [
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

export const contactRequestsQuery: LdhopQuery<
  | LdhopQueryVars<typeof profileDocuments>
  | MatchVar<typeof personInbox>
  | '?notification'
  | '?inviteNotification'
> = [
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
