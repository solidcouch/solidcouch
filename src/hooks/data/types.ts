import { DEFAULT_QUERY_KEY } from '@ldhop/react'

export enum AccessMode {
  Read = 'Read',
  Write = 'Write',
  Append = 'Append',
  Control = 'Control',
}

export enum QueryKey {
  simpleMailerIntegration = 'simpleMailerIntegration',
  mailerIntegration = 'mailerIntegration',
  rdfDocument = `${DEFAULT_QUERY_KEY}`,
  file = 'file',
  geoindex = 'geoindex',
  wikidataSearch = 'wikidataSearch',
  wikidataEntity = 'wikidataEntity',
}
