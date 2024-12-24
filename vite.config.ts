import react from '@vitejs/plugin-react-swc'
import fs from 'fs-extra'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import { buildClientId } from './scripts/build-clientid'

const serveClientId = ({
  baseUrl: envBaseUrl,
}: {
  baseUrl: string
}): PluginOption => ({
  name: 'populate-clientid.jsonld',
  configureServer: server => {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/clientid.jsonld') {
        const port = server.config.server.port
        const a = await fs.readFile('./public/clientid.jsonld', 'utf8')
        const baseUrl = envBaseUrl ?? 'http://localhost:' + port

        const b = a.replaceAll('%BASE_URL%', baseUrl)

        res.setHeader('content-type', 'application/ld+json')
        res.statusCode = 200
        res.write(b)
        res.end()
      } else {
        next()
      }
    })
  },
})

// https://vite.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const baseUrl =
    env.VITE_BASE_URL || // take environment variable
    (env.VERCEL_BRANCH_URL && 'https://' + env.VERCEL_BRANCH_URL) // or vercel variable

  return {
    plugins: [
      react(),
      serveClientId({ baseUrl }),
      {
        name: 'post-build-script',
        closeBundle() {
          // This hook runs after the build is completed
          if (mode === 'production') buildClientId({ baseUrl })
        },
      },
    ],
    define: {
      'process.env': process.env,
    },
  }
})

/*
const { readFileSync } = require('fs')

/**
 * Serve application clientId with correct urls in development environment
 *
 * You can specify the urls in BASE_URL environment variable
 * It also takes BASE_URL of Vercel automatically (not sure if this is useful)
 * By default BASE_URL is set to http://localhost:5173
 * /
module.exports = function (app) {
  app.get('/clientid.jsonld', (req, res) => {
    const clientIdTemplate = readFileSync('./public/clientid.jsonld', 'utf8')
    const clientId = clientIdTemplate.replaceAll(
      '%BASE_URL%',
      import.meta.env.BASE_URL ??
        (import.meta.env.VERCEL_BRANCH_URL &&
          'https://' + import.meta.env.VERCEL_BRANCH_URL) ??
        `http://localhost:${import.meta.env.PORT ?? 5173}`,
    )

    res.end(clientId)
  })
}
*/
