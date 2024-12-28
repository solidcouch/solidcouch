import fs from 'node:fs'
const clientIdPath = './dist/clientid.jsonld'

export const buildClientId = ({
  baseUrl,
  name,
  logo,
}: {
  baseUrl: string
  name?: string
  logo?: string
}) => {
  // Read the template file
  let content = fs.readFileSync(clientIdPath, 'utf8')

  if (!baseUrl) throw new Error("VITE_BASE_URL hasn't been provided")

  // Replace placeholders with actual values
  content = content.replaceAll('%BASE_URL%', baseUrl)

  // update name and logo if available
  const contentObject = JSON.parse(content)

  if (name) contentObject.client_name = name
  if (logo) contentObject.logo_uri = new URL(logo, baseUrl).toString()

  content = JSON.stringify(contentObject, null, 2)

  // Write the content to the output file
  fs.writeFileSync(clientIdPath, content, 'utf8')
}

/**
 * Build script copies public/clientid.jsonld template to build/clientid.jsonld
 * and in this script, we replace the %BASE_URL% in that file with relevant environment variable
 * BASE_URL or 'https://' + VERCEL_BRANCH_URL or default 'https://app.solidcouch.org'
 */
