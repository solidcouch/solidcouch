import { URI } from '@/types'
import { rdf, solid } from '@/utils/rdf-namespaces'
import { RdfQuery } from '@ldhop/core'
import { webIdProfileQuery } from './profile'

enum Variables {
  publicTypeIndex = '?publicTypeIndex',
  privateTypeIndex = '?privateTypeIndex',
  typeRegistration = '?typeRegistration',
  typeRegistrationForClass = '?typeRegistrationForClass',
  instance = '?instance',
  instanceContainer = '?instanceContainer',
}

export const getTypeIndexQuery = ({
  forClass,
}: {
  forClass: URI
}): RdfQuery => [
  ...webIdProfileQuery,
  {
    type: 'match',
    predicate: rdf.type,
    object: solid.TypeRegistration,
    graph: Variables.privateTypeIndex,
    pick: 'subject',
    target: Variables.typeRegistration,
  },
  {
    type: 'match',
    predicate: rdf.type,
    object: solid.TypeRegistration,
    graph: Variables.publicTypeIndex,
    pick: 'subject',
    target: Variables.typeRegistration,
  },
  {
    type: 'match',
    subject: Variables.typeRegistration,
    predicate: solid.forClass,
    object: forClass,
    pick: 'subject',
    target: Variables.typeRegistrationForClass,
  },
  {
    type: 'match',
    subject: Variables.typeRegistrationForClass,
    predicate: solid.instance,
    pick: 'object',
    target: Variables.instance,
  },
  {
    type: 'match',
    subject: Variables.typeRegistrationForClass,
    predicate: solid.instanceContainer,
    pick: 'object',
    target: Variables.instanceContainer,
  },
]
