export * from './leaflet'

export const communityId =
  process.env.REACT_APP_COMMUNITY ||
  'https://solidweb.me/dev-sleepy-bike/community#us'

/**
 * Name of folder in which to store person's data of this community
 *
 * During setup, the container with this community's data will be, by default, created at {storage}/hospex/{communityContainer}/
 * Otherwise this doesn't matter
 * Don't include trailing slash!
 */
export const communityContainer =
  process.env.REACT_APP_COMMUNITY_CONTAINER || 'dev-sleepy-bike'

export const wikidataLDF = 'https://query.wikidata.org/bigdata/ldf'
