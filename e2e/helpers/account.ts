import { type Page, expect } from '@playwright/test'
import { randomUUID } from 'crypto'
import { v7 } from 'css-authn'
import { acl, foaf, ldp, solid, space, vcard } from 'rdf-namespaces'
import { generateAcl } from '../../cypress/support/helpers/acl'
import { getAcl, getContainer } from '../../src/utils/helpers'
import { setupCommunity } from './community'
import { generateRandomString } from './helpers'

type SkipOptions =
  | 'preferences'
  | 'publicTypeIndex'
  | 'privateTypeIndex'
  | 'inbox'
  | 'personalHospexDocument'
  | 'joinCommunity'

export const createRandomAccount = async () => {
  const username = randomUUID()
  const password = 'correcthorsebatterystaples'

  const account = await v7.createAccount({
    username,
    password,
    email: username + '@example.local',
    provider: 'http://localhost:4000/',
  })

  const authenticatedFetch = async (...props: Parameters<typeof fetch>) => {
    const authFetch = await v7.getAuthenticatedFetch({
      ...account,
      provider: account.idp,
    })
    return authFetch(...props)
  }

  return { ...account, provider: account.idp, authFetch: authenticatedFetch }
}

export const signIn = async (
  page: Page,
  account: { email: string; password: string; idp: string },
) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('textbox', { name: 'Your webId or provider' }).click()
  await page
    .getByRole('textbox', { name: 'Your webId or provider' })
    .fill(account.idp)
  await page.getByRole('button', { name: 'Continue' }).click()
  try {
    await page
      .getByRole('button', { name: 'Use a different account' })
      .click({ timeout: 3000 })
  } catch {
    //
  }

  await page.getByRole('textbox', { name: 'Email' }).fill(account.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(account.password)
  await page.getByRole('button', { name: 'Log in' }).click()

  await page.getByRole('button', { name: 'Authorize' }).click()
  await expect(page).toHaveURL('/')
}

// export const uiSetup = async (page: Page) => {
//   await expect(page.locator('h2')).toContainText('Prepare Pod')
//   await page.getByRole('button', { name: 'Continue' }).click()
//   await expect(page.locator('h2')).toContainText('Join Community')
//   await page.getByRole('button', { name: 'Continue' }).click()
//   // if mailer is not set up, a step is missing here
//   await expect(page.locator('#root')).toContainText('travel')
// }

export const signOut = async (page: Page) => {
  await page.goto('/')
  await page.getByRole('button').nth(1).click()
  await page.getByRole('button', { name: 'sign out' }).click()
  await page.goto('http://localhost:4000/.oidc/session/end')
  await page.getByRole('button', { name: 'Yes, sign me out' }).click()
  await expect(page.getByRole('heading')).toContainText('Sign-out Success')
}

const setupPod = async (
  account: Awaited<ReturnType<typeof createRandomAccount>>,
  community: Awaited<ReturnType<typeof setupCommunity>>,
  {
    skip = [],
    hospexContainerName = 'test-community',
  }: { skip?: SkipOptions[]; hospexContainerName?: string } = {},
) => {
  const preferencesFileUri = `${account.podUrl}settings/preferences.ttl`
  const publicTypeIndexUri = `${account.podUrl}settings/publicTypeIndex.ttl`
  const privateTypeIndexUri = `${account.podUrl}settings/privateTypeIndex.ttl`
  const hospexContainer = `${account.podUrl}hospex/${hospexContainerName}/`
  const hospexDocument = hospexContainer + 'card'
  const inboxUri = `${account.podUrl}inbox/`

  const authFetch = await v7.getAuthenticatedFetch(account)

  // create inbox
  if (!skip.includes('inbox')) {
    await authFetch(inboxUri, {
      method: 'PUT',
      headers: {
        Link: '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
        'content-type': 'text/turtle',
      },
    })

    await authFetch(await getAcl(inboxUri), {
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: generateAcl(inboxUri, [
        {
          isDefault: true,
          permissions: ['Read', 'Write', 'Control'],
          agents: [account.webId],
        },
        {
          // isDefault: true,
          permissions: ['Append'],
          agentClasses: [acl.AuthenticatedAgent],
        },
      ]),
    })
    await authFetch(account.webId, {
      method: 'PATCH',
      headers: { 'content-type': 'text/n3' },
      body: `
      _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
        <${account.webId}> <${ldp.inbox}> <${inboxUri}>.
      }.`,
    })
  }
  // create preferences file
  if (!skip.includes('preferences')) {
    // save preferences file
    await authFetch(preferencesFileUri, {
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: `
      @prefix pim: <http://www.w3.org/ns/pim/space#>.
      <> a pim:ConfigurationFile .`,
    })
    // save private acl to folder
    const settingsContainer = getContainer(preferencesFileUri)
    await authFetch(await getAcl(settingsContainer), {
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: generateAcl(settingsContainer, [
        {
          isDefault: true,
          agents: [account.webId],
          permissions: ['Read', 'Write', 'Control'],
        },
      ]),
    })
    // link in webId profile
    await authFetch(account.webId, {
      method: 'PATCH',
      headers: { 'content-type': 'text/n3' },
      body: `
      _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
        <${account.webId}> <${space.preferencesFile}> <${preferencesFileUri}>.
      }.`,
    })
  }
  // create public type index
  if (!skip.includes('publicTypeIndex')) {
    await authFetch(publicTypeIndexUri, {
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: `
      @prefix solid: <http://www.w3.org/ns/solid/terms#>.
      <> a solid:ListedDocument, solid:TypeIndex.`,
    })
    await authFetch(publicTypeIndexUri + '.acl', {
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: generateAcl(publicTypeIndexUri, [
        {
          permissions: ['Read', 'Write', 'Control'],
          agents: [account.webId],
        },
        { permissions: ['Read'], agentClasses: [foaf.Agent] },
      ]),
    })
    await authFetch(account.webId, {
      method: 'PATCH',
      headers: { 'content-type': 'text/n3' },
      body: `
      _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
        <${account.webId}> <${solid.publicTypeIndex}> <${publicTypeIndexUri}>.
      }.`,
    })
  }
  // create private type index
  if (!skip.includes('privateTypeIndex')) {
    await authFetch(privateTypeIndexUri, {
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: `
      @prefix solid: <http://www.w3.org/ns/solid/terms#>.
      <> a solid:UnlistedDocument, solid:TypeIndex.`,
    })
    await authFetch(privateTypeIndexUri + '.acl', {
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: generateAcl(privateTypeIndexUri, [
        { permissions: ['Read', 'Write', 'Control'], agents: [account.webId] },
      ]),
    })
    await authFetch(
      skip.includes('preferences') ? account.webId : preferencesFileUri,
      {
        method: 'PATCH',
        headers: { 'content-type': 'text/n3' },
        body: `
      _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
        <${account.webId}> <${solid.privateTypeIndex}> <${privateTypeIndexUri}>.
      }.`,
      },
    )
  }
  // create hospex document
  if (!skip.includes('personalHospexDocument')) {
    const communityUri = community.communityUri
    await authFetch(hospexDocument, {
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: `
      @prefix sioc: <http://rdfs.org/sioc/ns#>.
      @prefix hospex: <http://w3id.org/hospex/ns#>.
      <${account.webId}> sioc:member_of <${communityUri}>;
        hospex:storage <${hospexContainer}>.`,
    })
    await authFetch(hospexContainer + '.acl', {
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: generateAcl(hospexContainer, [
        {
          isDefault: true,
          permissions: ['Read', 'Write', 'Control'],
          agents: [account.webId],
        },
        {
          isDefault: true,
          permissions: ['Read'],
          agentGroups: [community.groupUri],
        },
      ]),
    })
    await authFetch(publicTypeIndexUri, {
      method: 'PATCH',
      headers: { 'content-type': 'text/n3' },
      body: `
      @prefix hospex: <http://w3id.org/hospex/ns#>.
      _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
        <#hospex> a <${solid.TypeRegistration}>;
        <${solid.forClass}> hospex:PersonalHospexDocument;
        <${solid.instance}> <${hospexDocument}>.
      }.`,
    })
  }

  // join community
  if (!skip.includes('joinCommunity')) {
    await authFetch(community.groupUri, {
      method: 'PATCH',
      headers: { 'content-type': 'text/n3' },
      body: `
      _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
        <${community.groupUri}> <${vcard.hasMember}> <${account.webId}>.
      }.`,
    })
  }

  return {
    publicTypeIndex: publicTypeIndexUri,
    privateTypeIndex: privateTypeIndexUri,
    hospexContainer,
    hospexProfile: hospexDocument,
    inbox: inboxUri,
  }
}

type Profile = { name: string; description: { [lang: string]: string } }
const saveProfileData = async (
  account: Awaited<ReturnType<typeof createRandomAccount>>,
  setup: Awaited<ReturnType<typeof setupPod>>,
  profile: Profile,
) => {
  const descriptions = Object.entries(profile.description)
    .map(
      ([language, description]) =>
        `<${account.webId}> <${vcard.note}> """${description}"""@${language}.`,
    )
    .join('\n')
  await account.authFetch(setup.hospexProfile, {
    method: 'PATCH',
    headers: { 'content-type': 'text/n3' },
    body: `_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
      <${account.webId}> <${foaf.name}> "${profile.name}".
      ${descriptions}
    }.`,
  })
  return profile
}

export const createPerson = async ({
  community,
}: {
  community: Awaited<ReturnType<typeof setupCommunity>>
}) => {
  const account = await createRandomAccount()
  const pod = await setupPod(account, community)
  const profile = await saveProfileData(account, pod, {
    name: generateRandomString(8),
    description: {
      en: generateRandomString(20 + Math.random() * 40),
      cs: generateRandomString(20 + Math.random() * 40),
    },
  })

  return { account, pod, profile }
}
