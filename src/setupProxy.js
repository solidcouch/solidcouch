const { readFileSync } = require('fs')

/**
 * Serve application clientId with correct urls in development environment
 *
 * You can specify the urls in BASE_URL environment variable
 * It also takes BASE_URL of Vercel automatically (not sure if this is useful)
 * By default BASE_URL is set to http://localhost:3000
 */
module.exports = function (app) {
  app.get('/clientid.jsonld', (req, res) => {
    const clientIdTemplate = readFileSync('./public/clientid.jsonld', 'utf8')
    const clientId = clientIdTemplate.replaceAll(
      '%BASE_URL%',
      process.env.BASE_URL ??
        (process.env.VERCEL_BRANCH_URL &&
          'https://' + process.env.VERCEL_BRANCH_URL) ??
        `http://localhost:${process.env.PORT ?? 3000}`,
    )

    res.end(clientId)
  })
}
