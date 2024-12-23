// TODO fix the weird linter errors that we currently suppress above (shouldn't show up)
/**
 * This script fetches community info from community Solid pod and saves them as environment variables in .env.build
 * The env variables are used to populate index.html in build step
 * It expects VITE_COMMUNITY environment variable present, otherwise it uses default SolidCouch name and description
 */

import { QueryAndStore, run } from '@ldhop/core'
import fetch from 'cross-fetch'
import { writeFileSync } from 'fs'
import he from 'he'
import type { Quad_Object } from 'n3'
import { foaf, sioc } from 'rdf-namespaces'

const communityId = process.env.VITE_COMMUNITY

const defaultName = 'SolidCouch'
const defaultAbout =
  "SolidCouch is a hospitality exchange community app. It's decentralized, and members own their data."

;(async () => {
  const qas = new QueryAndStore(
    [{ type: 'add resources', variable: '?community' }],
    { community: new Set(communityId ? [communityId] : []) },
  )
  await run(qas, fetch)

  const nameNodes = communityId
    ? qas.store.getObjects(communityId, sioc.name, null)
    : []
  const aboutNodes = communityId
    ? qas.store.getObjects(communityId, sioc.about, null)
    : []
  const logoNodes = communityId
    ? qas.store.getObjects(communityId, foaf.logo, null)
    : []
  const homepageNodes = communityId
    ? qas.store.getObjects(communityId, foaf.homepage, null)
    : []

  const getLanguageString = (
    nodes: Quad_Object[],
    language: string,
    noLanguageFallback = true,
  ) =>
    nodes.find(n => n.termType === 'Literal' && n.language === language)
      ?.value ||
    (noLanguageFallback
      ? nameNodes.find(n => n.termType === 'Literal' && !n.language)?.value
      : undefined)

  const logo = logoNodes[0]?.id ?? ''
  const name = getLanguageString(nameNodes, 'en') || defaultName
  const about = getLanguageString(aboutNodes, 'en') || defaultAbout
  const homepage = homepageNodes[0]?.value ?? ''

  // make sure all dangerous characters are escaped
  // create-react-app doesn't take care on its own
  const env = `VITE_COMMUNITY_LOGO='${encodeURI(logo)}'
VITE_COMMUNITY_NAME='${he.encode(name)}'
VITE_COMMUNITY_NAME_UNSAFE='${name}'
VITE_COMMUNITY_ABOUT='${he.encode(about)}'
VITE_COMMUNITY_HOMEPAGE='${encodeURI(homepage)}'
`

  writeFileSync('.env.build', env)
})()
