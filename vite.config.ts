import react from '@vitejs/plugin-react-swc'
import fs from 'fs-extra'
import { defineConfig, type PluginOption } from 'vite'

const serveClientId: PluginOption = {
  name: 'populate-clientid.jsonld',
  configureServer: server => {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/clientid.jsonld') {
        const port = server.config.server.port
        const a = await fs.readFile('./public/clientid.jsonld', 'utf8')
        const baseUrl = process.env.BASE_URL ?? 'http://localhost:' + port
        const b = a.replaceAll('%BASE_URL%', baseUrl)
        // console.log(baseUrl)
        // console.log(a)
        res.setHeader('content-type', 'application/ld+json')
        res.statusCode = 200
        res.write(b)
        res.end()
      } else {
        next()
      }
    })
  },
}

// https://vite.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [react(), serveClientId],
  define: {
    'process.env': process.env,
  },
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
