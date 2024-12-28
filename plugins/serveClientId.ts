import fs from 'fs/promises'
import { ConfigEnv, loadEnv, type PluginOption } from 'vite'

export const serveClientId = (config: ConfigEnv): PluginOption => ({
  name: 'populate-clientid.jsonld',
  configureServer: server => {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/clientid.jsonld') {
        const env = loadEnv(config.mode, process.cwd())
        const port = server.config.server.port
        const baseUrl = env.VITE_BASE_URL || 'http://localhost:' + port

        const original = await fs.readFile('./public/clientid.jsonld', 'utf8')
        const updated = original.replaceAll('%BASE_URL%', baseUrl)

        res.setHeader('content-type', 'application/ld+json')
        res.statusCode = 200
        res.write(updated)
        res.end()
      } else {
        next()
      }
    })
  },
})
