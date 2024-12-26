// not sure how to resolve errors resulting from this eslint rule
// it's because we overwrite exports from rdf-namespaces here
import * as ns from 'rdf-namespaces'
import { https } from './helpers'

export * from 'rdf-namespaces'

const base = {
  geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
  hospex: 'http://w3id.org/hospex/ns#',
  meeting: 'http://www.w3.org/ns/pim/meeting#',
  ui: 'http://www.w3.org/ns/ui#',
  wf: 'http://www.w3.org/2005/01/wf/flow#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
}

// export const geo = {
//   Point: base.geo + 'Point',
//   location: base.geo + 'location',
//   lat: base.geo + 'lat',
//   long: base.geo + 'long',
// }

export const hospex = {
  Accommodation: base.hospex + 'Accommodation',
  PersonalHospexDocument: base.hospex + 'PersonalHospexDocument',
  offers: base.hospex + 'offers',
  offeredBy: base.hospex + 'offeredBy',
  storage: base.hospex + 'storage',
}

export const as = {
  ...(Object.fromEntries(
    Object.entries(ns.as).map(([key, value]) => [key, https(value)]),
  ) as typeof ns.as),
  // subject is missing in rdf-namespaces, but exists in as
  subject: https(ns.as.object.replace('object', 'subject')),
}

export const wf = {
  participation: base.wf + 'participation',
  participant: base.wf + 'participant',
  ...ns.wf,
}

export const meeting = {
  LongChat: base.meeting + 'LongChat',
  ...ns.meeting,
}

// export const xsd = {
//   dateTime: base.xsd + 'dateTime',
//   decimal: base.xsd + 'decimal',
// }

// export const ui = {
//   sharedPreferences: base.ui + 'sharedPreferences',
// }
