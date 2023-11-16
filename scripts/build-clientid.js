const fs = require('fs')
const clientIdPath = './build/clientid.jsonld'

/**
 * Build script copies public/clientid.jsonld template to build/clientid.jsonld
 * and in this script, we replace the %BASE_URL% in that file with relevant environment variable
 * BASE_URL or 'https://' + VERCEL_BRANCH_URL or default 'https://sleepy.bike'
 */

// Read the template file
let content = fs.readFileSync(clientIdPath, 'utf8')

// Replace placeholders with actual values
content = content.replaceAll(
  '%BASE_URL%',
  process.env.BASE_URL || // take environment variable
    (process.env.VERCEL_BRANCH_URL &&
      'https://' + process.env.VERCEL_BRANCH_URL) || // or vercel variable
    'https://sleepy.bike', // or a default
)

// Write the content to the output file
fs.writeFileSync(clientIdPath, content, 'utf8')

// eslint-disable-next-line no-console
console.log('ClientID generated successfully.')
