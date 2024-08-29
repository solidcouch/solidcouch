#!/usr/bin/env node

const fs = require('fs')
const clientIdPath = './build/clientid.jsonld'

/**
 * Build script copies public/clientid.jsonld template to build/clientid.jsonld
 * and in this script, we replace the %BASE_URL% in that file with relevant environment variable
 * BASE_URL or 'https://' + VERCEL_BRANCH_URL or default 'https://app.solidcouch.org'
 */

// Read the template file
let content = fs.readFileSync(clientIdPath, 'utf8')

// Replace placeholders with actual values
content = content.replaceAll(
  '%BASE_URL%',
  process.env.BASE_URL || // take environment variable
    (process.env.VERCEL_BRANCH_URL &&
      'https://' + process.env.VERCEL_BRANCH_URL) || // or vercel variable
    'https://app.solidcouch.org', // or a default
)

// update name and logo if available
const contentObject = JSON.parse(content, 'utf8')
const communityName = process.env.REACT_APP_COMMUNITY_NAME_UNSAFE
const communityLogo = process.env.REACT_APP_COMMUNITY_LOGO
if (communityName) {
  contentObject.client_name = communityName
  // eslint-disable-next-line no-console
  console.log('Updated name in ClientID:', communityName)
}
if (communityLogo) {
  contentObject.logo_uri = communityLogo
  // eslint-disable-next-line no-console
  console.log('Updated logo in ClientID:', communityLogo)
}
content = JSON.stringify(contentObject, null, 2)

// Write the content to the output file
fs.writeFileSync(clientIdPath, content, 'utf8')

// eslint-disable-next-line no-console
console.log('ClientID generated successfully.')
