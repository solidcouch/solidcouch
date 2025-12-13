import {
  emailNotificationsIdentity,
  emailNotificationsService,
} from './variables'
export { tileServer } from './leaflet'
export {
  communityContainer,
  communityId,
  darkModeLogoStyle,
  defaultCommunityName,
  emailNotificationsIdentity,
  emailNotificationsService,
  emailNotificationsType,
  geoindexService,
} from './variables'

// TODO maybe we'll fetch the identity directly from the mailer, when it supports that option, so the setup will be less complicated
if (emailNotificationsService && !emailNotificationsIdentity)
  throw new Error(
    'Please provide webId of email notifications service in environment variable VITE_EMAIL_NOTIFICATIONS_IDENTITY',
  )

// export const wikidataLDF = 'https://query.wikidata.org/bigdata/ldf'

export type IssuerConfig = {
  recommended?: boolean // the recommended provider for sign up
  featured?: boolean // featured providers for sign in
  issuer: string
  registration?: string
  server: 'NSS' | 'CSS'
}

export const oidcIssuers: IssuerConfig[] = [
  {
    recommended: true,
    featured: true,
    issuer: 'https://solidcommunity.net/',
    registration:
      'https://solidcommunity.net/.account/login/password/register/',
    server: 'CSS',
  },
  {
    featured: true,
    issuer: 'https://solidweb.me/',
    registration: 'https://solidweb.me/.account/login/password/register/',
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
    issuer: 'https://pods.solidcommunity.au',
    registration:
      'https://pods.solidcommunity.au/.account/login/password/register/',
    server: 'CSS',
  },
]

export { defaultLocale, locales } from './locales'
