const { readFileSync } = require('fs')

/**
 * Serve application clientId with correct urls in development environment
 *
 * You can specify the urls in BASE_URL environment variable
 * It also takes BASE_URL of Vercel automatically (not sure if this is useful)
 * By default BASE_URL is set to http://localhost:5173
 */
module.exports = function (app) {
  app.get('/clientid.jsonld', (req, res) => {
    const clientIdTemplate = readFileSync('./public/clientid.jsonld', 'utf8')
    const clientId = clientIdTemplate.replaceAll(
      '%BASE_URL%',
      import.meta.env.BASE_URL ??
        (import.meta.env.VERCEL_BRANCH_URL &&
          'https://' + import.meta.env.VERCEL_BRANCH_URL) ??
        `http://localhost:${import.meta.env.PORT ?? 3000}`,
    )

    res.end(clientId)
  })
}
