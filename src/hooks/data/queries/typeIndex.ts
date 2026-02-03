import { Constant } from '@ldhop/core'
import * as rdf from 'rdf-namespaces/rdf'
import * as solid from 'rdf-namespaces/solid'
import { webIdProfileQuery } from './profile'

export const getTypeIndexQuery = <C extends Constant>({
  forClass,
}: {
  forClass: C
}) =>
  webIdProfileQuery
    .match(null, rdf.type, solid.TypeRegistration, '?privateTypeIndex')
    .s('?typeRegistration')
    .match(null, rdf.type, solid.TypeRegistration, '?publicTypeIndex')
    .s('?typeRegistration')
    .match('?typeRegistration', solid.forClass, forClass)
    .s('?typeRegistrationForClass')
    .match(`?typeRegistrationForClass`, solid.instance)
    .o('?instance')
    .match(`?typeRegistrationForClass`, solid.instanceContainer)
    .o('?instanceContainer')
