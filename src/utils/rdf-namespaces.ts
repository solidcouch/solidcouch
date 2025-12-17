// not sure how to resolve errors resulting from this eslint rule
// it's because we overwrite exports from rdf-namespaces here
import * as ns from 'rdf-namespaces'

const base = {
  // geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
  hospex: 'http://w3id.org/hospex/ns#',
  meeting: 'http://www.w3.org/ns/pim/meeting#',
  // ui: 'http://www.w3.org/ns/ui#',
  wf: 'http://www.w3.org/2005/01/wf/flow#',
} as const

// export const geo = {
//   Point: base.geo + 'Point',
//   location: base.geo + 'location',
//   lat: base.geo + 'lat',
//   long: base.geo + 'long',
// }

export const hospex = {
  Accommodation: `${base.hospex}Accommodation` as const,
  PersonalHospexDocument: `${base.hospex}PersonalHospexDocument` as const,
  offers: `${base.hospex}offers` as const,
  offeredBy: `${base.hospex}offeredBy` as const,
  storage: `${base.hospex}storage` as const,
}

export const wf = {
  participation: `${base.wf}participation` as const,
  participant: `${base.wf}participant` as const,
  ...ns.wf,
}

export const meeting = {
  LongChat: `${base.meeting}LongChat` as const,
  // message: `${base.meeting}message` as const,
  ...ns.meeting,
}

// export const ui = {
//   sharedPreferences: base.ui + 'sharedPreferences',
// }
