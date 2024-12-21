import type { ConfigContextType } from './config/hooks'

declare global {
  interface Window {
    updateAppConfig: (newConfig: Partial<ConfigContextType>) => void
    resetAppConfig: () => void
    appConfig: ConfigContextType
  }
}
