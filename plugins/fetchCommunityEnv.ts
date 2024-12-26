/**
 * Fetch community info into environment variables
 */

import { ConfigEnv, loadEnv, PluginOption } from 'vite'
import {
  defaultAbout,
  defaultLogo,
  defaultName,
  fetchCommunityInfo,
} from '../scripts/fetch-community-info'

export const fetchCommunityEnv = (config: ConfigEnv): PluginOption => ({
  name: 'fetch-community-to-environment-variables',
  config: async () => {
    const env = loadEnv(config.mode, process.cwd())
    const communityUri = env.VITE_COMMUNITY
    const info = await fetchCommunityInfo(communityUri)

    process.env.VITE_COMMUNITY_NAME = info.name ?? defaultName
    process.env.VITE_COMMUNITY_ABOUT = info.about ?? defaultAbout
    process.env.VITE_COMMUNITY_LOGO = info.logo ?? defaultLogo
    process.env.VITE_COMMUNITY_NAME_UNSAFE = info.name_UNSAFE
    process.env.VITE_COMMUNITY_HOMEPAGE = info.homepage
  },
})
