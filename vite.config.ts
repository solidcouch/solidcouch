import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ConfigEnv, defineConfig } from 'vite'
import { fetchCommunityEnv } from './plugins/fetchCommunityEnv'
import { postbuild } from './plugins/postbuild'
import { serveClientId } from './plugins/serveClientId'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig((config: ConfigEnv) => {
  return {
    plugins: [
      fetchCommunityEnv(config),
      react(),
      serveClientId(config),
      postbuild(config),
    ],
    define: {
      'process.env': process.env,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
