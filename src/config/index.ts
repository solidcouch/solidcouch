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

/**
 * Service for email notifications
 * Should work along the lines of https://github.com/openHospitalityNetwork/solid-email-notifications
 */
export const emailNotificationsService =
  process.env.REACT_APP_EMAIL_NOTIFICATIONS_SERVICE ?? ''
// TODO maybe we'll fetch the identity directly from the mailer, when it supports that option, so the setup will be less complicated
export const emailNotificationsIdentity =
  process.env.REACT_APP_EMAIL_NOTIFICATIONS_IDENTITY ?? ''

if (emailNotificationsService && !emailNotificationsIdentity)
  throw new Error(
    'Please provide webId of email notifications service in environment variable REACT_APP_EMAIL_NOTIFICATIONS_IDENTITY',
  )

export const wikidataLDF = 'https://query.wikidata.org/bigdata/ldf'

export const oidcIssuers = [
  {
    issuer: 'https://solidcommunity.net',
    registration: 'https://solidcommunity.net/register',
    server: 'NSS',
  },
  {
    issuer: 'https://solidweb.me',
    registration: 'https://solidweb.me/idp/register/',
    server: 'CSS',
  },
  {
    issuer: 'https://solid.redpencil.io/',
    registration: 'https://solid.redpencil.io/idp/register/',
    server: 'CSS',
  },
  {
    issuer: 'https://teamid.live/',
    registration: 'https://teamid.live/.account/login/password/register/',
    server: 'CSS',
  },
  {
    issuer: 'https://solidweb.org',
    registration: 'https://solidweb.org/register',
    server: 'NSS',
  },
  {
    issuer: 'https://datapod.igrant.io',
    registration: 'https://datapod.igrant.io/register',
    server: 'NSS',
  },
  {
    issuer: 'https://inrupt.net',
    registration: 'https://inrupt.net/register',
    server: 'NSS',
  },
]

export const oidcIssuerRegistrations = []
