import { Constant, LdhopQuery } from '@ldhop/core'
import { rdf, solid } from 'rdf-namespaces'
import { LdhopQueryVar, webIdProfileQuery } from './profile'

export const getTypeIndexQuery = <C extends Constant>({
  forClass,
}: {
  forClass: C
}): LdhopQuery<
  | LdhopQueryVar<typeof webIdProfileQuery>
  | '?typeRegistration'
  | '?typeRegistrationForClass'
  | '?instance'
  | '?instanceContainer'
> => [
  ...webIdProfileQuery,
  {
    type: 'match',
    predicate: rdf.type,
    object: solid.TypeRegistration,
    graph: `?privateTypeIndex`,
    pick: 'subject',
    target: `?typeRegistration`,
  },
  {
    type: 'match',
    predicate: rdf.type,
    object: solid.TypeRegistration,
    graph: `?publicTypeIndex`,
    pick: 'subject',
    target: `?typeRegistration`,
  },
  {
    type: 'match',
    subject: `?typeRegistration`,
    predicate: solid.forClass,
    object: forClass,
    pick: 'subject',
    target: `?typeRegistrationForClass`,
  },
  {
    type: 'match',
    subject: `?typeRegistrationForClass`,
    predicate: solid.instance,
    pick: 'object',
    target: `?instance`,
  },
  {
    type: 'match',
    subject: `?typeRegistrationForClass`,
    predicate: solid.instanceContainer,
    pick: 'object',
    target: `?instanceContainer`,
  },
]
