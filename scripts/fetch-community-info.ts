import { QueryAndStore, run } from '@ldhop/core'
import fetch from 'cross-fetch'
import he from 'he'
import type { Quad_Object } from 'n3'
import { foaf, sioc } from 'rdf-namespaces'

/**
 * Fetch and sanitize community data from community's Solid pod
 */
export const fetchCommunityInfo = async (
  communityId: string,
): Promise<{
  logo?: string
  name?: string
  name_UNSAFE?: string
  about?: string
  homepage?: string
}> => {
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
  const logo = logoNodes[0]?.id
  const name = getLanguageString(nameNodes, 'en')
  const about = getLanguageString(aboutNodes, 'en')
  const homepage = homepageNodes[0]?.value

  // make sure all dangerous characters are escaped
  return {
    logo: logo && encodeURI(logo),
    name: name && he.encode(name),
    name_UNSAFE: name,
    about: about && he.encode(about),
    homepage: homepage && encodeURI(homepage),
  }
}

export const defaultName = 'SolidCouch'
export const defaultAbout =
  "SolidCouch is a hospitality exchange community app. It's decentralized, and members own their data."
export const defaultLogo = '/favicon.ico'
