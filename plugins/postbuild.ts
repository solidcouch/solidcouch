import { ConfigEnv, loadEnv, PluginOption } from 'vite'
import { addCname } from '../scripts/add-cname'
import { buildClientId } from '../scripts/build-clientid'
import { generateFavicons } from '../scripts/generate-favicons'

export const postbuild = (config: ConfigEnv): PluginOption => ({
  name: 'post-build-script',
  closeBundle: async () => {
    const env = loadEnv(config.mode, process.cwd())
    const baseUrl = env.VITE_BASE_URL || 'http://localhost:4173'
    const logo = env.VITE_COMMUNITY_LOGO
    // This hook runs after the build is completed
    if (config.mode === 'production') {
      buildClientId({ baseUrl, name: env.VITE_COMMUNITY_NAME_UNSAFE, logo })
      // if base url is explicitly given, produce CNAME (for GitHub pages)
      if (env.VITE_BASE_URL) addCname({ baseUrl })
      // We don't want the build to break when favicon generation fails. Just fall back to SolidCouch defaults
      if (logo) await generateFavicons({ logo }).catch()
    }
  },
})
