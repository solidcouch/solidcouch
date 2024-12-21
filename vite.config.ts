import react from '@vitejs/plugin-react-swc'
import fs from 'fs-extra'
import { defineConfig, PluginOption } from 'vite'

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
export default defineConfig({
  plugins: [react(), serveClientId],
  define: {
    'process.env': process.env,
  },
})
