import type { ConfigType } from './config/hooks'

declare global {
  interface Window {
    updateAppConfig: (newConfig: Partial<ConfigType>) => void
    resetAppConfig: () => void
    appConfig: ConfigType
  }
}
