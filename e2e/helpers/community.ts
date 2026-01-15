import { type Page, expect } from '@playwright/test'
import { v7 } from 'css-authn'
import { acl, foaf } from 'rdf-namespaces'
import { generateAcl } from '../../cypress/support/helpers/acl'
import { getAcl } from '../../src/utils/helpers'
import { createRandomAccount } from './account'
import { updateAppConfig } from './helpers'

export const createCommunity = async ({
  name = 'Test Community',
  about = 'Development community for SolidCouch',
  pun,
  // logo,
}: {
  name?: string
  about?: string
  pun?: string
}) => {
  const account = await createRandomAccount()
  const communityUri = new URL('community#us', account.podUrl)
  const communityDoc = new URL(communityUri)
  communityDoc.hash = ''
  const communityAcl = await getAcl(communityDoc)
  const groupUri = new URL('group#us', account.podUrl)
  const groupAcl = await getAcl(groupUri)
  const groupDoc = new URL(groupUri)
  groupDoc.hash = ''

  const authFetch = await v7.getAuthenticatedFetch(account)

  await authFetch(groupUri, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `
      @prefix sioc: <http://rdfs.org/sioc/ns#>.
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#>.
      <${groupUri}> a sioc:Usergroup, vcard:Group;
      sioc:usergroup_of <${communityUri}>.`,
  })
  await authFetch(communityUri, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `
      @prefix foaf: <http://xmlns.com/foaf/0.1/>.
      @prefix hospex: <http://w3id.org/hospex/ns#>.
      @prefix sioc: <http://rdfs.org/sioc/ns#>.
      <${communityUri}>
        a hospex:Community, sioc:Community;
        sioc:name "${name}"@en;
        sioc:about """${about}"""@en;
        ${pun ? `sioc:note """${pun}"""@en;` : ''}
        sioc:has_usergroup <${groupUri}>.`,
    // ${logoUrl ? `foaf:logo <${logoUrl}>;` : ''}
  })

  await authFetch(communityAcl, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: generateAcl(communityDoc, [
      { permissions: ['Read', 'Write', 'Control'], agents: [account.webId] },
      { permissions: ['Read'], agentClasses: [foaf.Agent] },
    ]),
  })

  await authFetch(groupAcl, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: generateAcl(groupDoc, [
      { permissions: ['Read', 'Write', 'Control'], agents: [account.webId] },
      {
        permissions: ['Read'],
        agentClasses: [foaf.Agent],
        agentGroups: [groupUri],
      },
      { permissions: ['Append'], agentClasses: [acl.AuthenticatedAgent] },
    ]),
  })

  return {
    account,
    communityUri,
    groupUri,
    communityDoc,
    groupDoc,
    communityAcl,
    groupAcl,
    name,
    about,
    pun,
  }
}

export type Community = Awaited<ReturnType<typeof createCommunity>>

const setAppCommunity = async (page: Page, community: Community) => {
  const currentUrl = page.url()

  // set up the community as the app community
  await updateAppConfig(
    page,
    { communityId: community.communityUri },
    { locator: page.getByRole('navigation') },
  )

  await expect(page.getByRole('navigation')).toContainText(community.name)
  // get back to previous page
  if (currentUrl) await page.goto(currentUrl)
}

export const setupCommunity = async (
  page: Page,
  {
    name = 'Test Community',
    about = 'Development community for SolidCouch',
    pun,
    // logo,
  }: {
    name?: string
    about?: string
    pun?: string
  },
): Promise<Community> => {
  const community = await createCommunity({ name, about, pun })
  await setAppCommunity(page, community)
  return community
}
