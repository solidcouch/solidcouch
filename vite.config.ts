import react from '@vitejs/plugin-react-swc'
import { ConfigEnv, defineConfig } from 'vite'
import { fetchCommunityEnv } from './plugins/fetchCommunityEnv'
import { postbuild } from './plugins/postbuild'
import { serveClientId } from './plugins/serveClientId'

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
  }
})
