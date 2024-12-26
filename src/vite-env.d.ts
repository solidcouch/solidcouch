/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMMUNITY: string
  readonly VITE_COMMUNITY_CONTAINER: string
  readonly VITE_COMMUNITY_LOGO: string
  readonly VITE_COMMUNITY_NAME: string
  readonly VITE_COMMUNITY_NAME_UNSAFE: string
  readonly VITE_COMMUNITY_ABOUT: string
  readonly VITE_COMMUNITY_HOMEPAGE: string
  readonly VITE_GEOINDEX: string
  readonly VITE_EMAIL_NOTIFICATIONS_SERVICE: string
  readonly VITE_EMAIL_NOTIFICATIONS_IDENTITY: string
  readonly VITE_EMAIL_NOTIFICATIONS_TYPE: 'simple' | 'solid'
  readonly VITE_ENABLE_DEV_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
