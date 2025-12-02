import { lingui } from '@lingui/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ConfigEnv, defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import { version } from './package.json'
import { fetchCommunityEnv } from './plugins/fetchCommunityEnv'
import { postbuild } from './plugins/postbuild'
import { serveClientId } from './plugins/serveClientId'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let commit: string = ''
try {
  commit = execSync('git rev-parse HEAD').toString().trim()
} catch {
  // eslint-disable-next-line no-console
  console.warn("Couldn't get the commit hash")
}

// https://vite.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig((config: ConfigEnv) => {
  return {
    plugins: [
      fetchCommunityEnv(config),
      react({
        plugins: [
          [
            '@lingui/swc-plugin',
            {
              runtimeModules: {
                i18n: ['@lingui/core', 'i18n'],
                trans: ['@lingui/react', 'Trans'],
              },
            },
          ],
        ],
      }),
      lingui(),
      checker({
        typescript: { buildMode: true },
        eslint: { lintCommand: 'eslint .', useFlatConfig: true },
      }),
      serveClientId(config),
      postbuild(config),
    ],
    define: {
      'process.env': {
        VITE_COMMUNITY_NAME: process.env.VITE_COMMUNITY_NAME,
        VITE_COMMUNITY_ABOUT: process.env.VITE_COMMUNITY_ABOUT,
        VITE_COMMUNITY_LOGO: process.env.VITE_COMMUNITY_LOGO,
        VITE_COMMUNITY_NAME_UNSAFE: process.env.VITE_COMMUNITY_NAME_UNSAFE,
        VITE_COMMUNITY_HOMEPAGE: process.env.VITE_COMMUNITY_HOMEPAGE,
      },
      __APP_VERSION__: JSON.stringify(version),
      __APP_COMMIT__: JSON.stringify(commit),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
