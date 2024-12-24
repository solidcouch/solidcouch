import { ConfigEnv, loadEnv, PluginOption } from 'vite'
import { buildClientId } from '../scripts/build-clientid'

export const postbuild = (config: ConfigEnv): PluginOption => ({
  name: 'post-build-script',
  closeBundle() {
    const env = loadEnv(config.mode, process.cwd())
    const baseUrl = env.VITE_BASE_URL || 'http://localhost:4173'
    // This hook runs after the build is completed
    if (config.mode === 'production') buildClientId({ baseUrl })
  },
})
