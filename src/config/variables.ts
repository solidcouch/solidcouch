export const communityId =
  import.meta.env.VITE_COMMUNITY ||
  'https://solidweb.me/dev-sleepy-bike/community#us'

/**
 * Name of folder in which to store person's data of this community
 *
 * During setup, the container with this community's data will be, by default, created at {storage}/hospex/{communityContainer}/
 * Otherwise this doesn't matter
 * Don't include trailing slash!
 */
export const communityContainer =
  import.meta.env.VITE_COMMUNITY_CONTAINER || 'dev-solidcouch'

/**
 * Service for email notifications
 * Should work along the lines of https://github.com/openHospitalityNetwork/solid-email-notifications
 */
export const emailNotificationsService =
  import.meta.env.VITE_EMAIL_NOTIFICATIONS_SERVICE ?? ''
// TODO maybe we'll fetch the identity directly from the mailer, when it supports that option, so the setup will be less complicated
export const emailNotificationsIdentity =
  import.meta.env.VITE_EMAIL_NOTIFICATIONS_IDENTITY ?? ''
export const emailNotificationsType: 'simple' | 'solid' =
  (import.meta.env.VITE_EMAIL_NOTIFICATIONS_TYPE as
    | 'simple'
    | 'solid'
    | undefined) ?? 'simple'

export const geoindexService = import.meta.env.VITE_GEOINDEX
