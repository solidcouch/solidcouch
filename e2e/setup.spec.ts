import { expect, Page, test } from '@playwright/test'
import { Parser, Store } from 'n3'
import { foaf, ldp, sioc, solid, space, vcard } from 'rdf-namespaces'
import { generateAcl } from '../cypress/support/helpers/acl'
import { processAcl, removeHashFromURI } from '../src/utils/helpers'
import {
  createPerson,
  createRandomAccount,
  signIn,
  signOut,
  SkipOptions,
  type Account,
  type Person,
} from './helpers/account'
import {
  createCommunity,
  setupCommunity,
  type Community,
} from './helpers/community'
import { checkAlert, getAppConfig, updateAppConfig } from './helpers/helpers'
import { stubDirectMailer, stubWebhookMailer } from './helpers/mailer'

test.describe('Setup Solid pod', () => {
  let community: Community
  test.beforeEach(async ({ page }) => {
    community = await setupCommunity(page, { name: 'communityName' })
  })
  ;(
    [
      {
        item: '',
        description: 'everything is set up',
        testTitle: 'should skip the setup step',
        skip: [],
        steps: 0,
      },
      {
        item: 'space:storage',
        testTitle:
          'should setup the pod just fine (find storage by checking parent folders)',
        skip: ['storage', 'personalHospexDocument'],
        steps: 2,
      },
      { item: 'preferences file', skip: ['preferences'], steps: 1 },
      { item: 'public type index', skip: ['publicTypeIndex'], steps: 2 },
      { item: 'private type index', skip: ['privateTypeIndex'], steps: 1 },
      { item: 'inbox', skip: ['inbox'], steps: 1 },
      {
        item: 'personal hospex document for this community',
        skip: ['personalHospexDocument'],
        steps: 2,
      },
      {
        item: '',
        description: 'community not joined',
        testTitle: 'should join the community',
        skip: ['joinCommunity'],
        steps: 2,
      },
    ] satisfies {
      item: string
      skip: SkipOptions[]
      steps: number
      description?: string
      testTitle?: string
    }[]
  ).map(({ item, skip, steps, description, testTitle }) => {
    test.describe(description ?? `${item} is missing`, () => {
      let person: Person

      test.beforeEach(async ({ page }) => {
        person = await createPerson({ community, skip })
        await stubDirectMailer(page, { person })
        await signIn(page, person.account)
      })

      test(testTitle ?? `should create ${item}`, async ({ page }) => {
        for (let step = 0; step < steps; ++step) {
          await page.getByTestId(`setup-step-${step}-continue`).click()
        }
        await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()
      })

      // TODO test correct access rights where relevant (conditionally)
      test.fixme('test correct access rights', async () => {})
    })
  })

  test.describe('the first step fails', () => {
    test('should show error', async ({ page }) => {
      const person = await createPerson({
        community,
        skip: ['publicTypeIndex', 'privateTypeIndex'],
      })
      await stubDirectMailer(page, { person })
      await signIn(page, person.account)
      await page.route(person.pod.publicTypeIndex, async route => {
        if (['PUT', 'PATCH'].includes(route.request().method())) {
          await new Promise(resolve => setTimeout(resolve, 200))
          await route.fulfill({ status: 418 })
        } else await route.fallback()
      })
      await page.getByTestId(`setup-step-0-continue`).click()
      await checkAlert(page, 'Preparing Solid Pod', false)
      await checkAlert(page, "Request failed: 418 I'm a teapot")
    })
  })

  test.describe('the second step fails', () => {
    test('[hospex storage] should show error', async ({ page }) => {
      const communityContainer = 'teststorage'

      await updateAppConfig(page, { communityContainer })

      const person = await createPerson({
        community,
        skip: ['personalHospexDocument'],
        hospexContainerName: communityContainer,
      })
      await stubDirectMailer(page, { person })
      await signIn(page, person.account)
      await page.route(person.pod.hospexProfile, async route => {
        if (['PUT', 'PATCH', 'POST'].includes(route.request().method())) {
          await new Promise(resolve => setTimeout(resolve, 200))
          await route.fulfill({ status: 418 })
        } else await route.fallback()
      })
      await page.getByTestId(`setup-step-0-continue`).click()
      await checkAlert(page, 'Solid Pod is prepared')
      await page.getByTestId(`setup-step-1-continue`).click()
      await checkAlert(page, 'Setting up hospex data', false)
      await checkAlert(page, "Request failed: 418 I'm a teapot")
    })

    test('[joining] should show error', async ({ page }) => {
      const person = await createPerson({
        community,
        skip: ['joinCommunity'],
      })
      await stubDirectMailer(page, { person })
      await signIn(page, person.account)
      await page.route(community.groupDoc.toString(), async route => {
        if (['PUT', 'PATCH', 'POST'].includes(route.request().method())) {
          await new Promise(resolve => setTimeout(resolve, 200))
          await route.fulfill({ status: 418 })
        } else await route.fallback()
      })
      await page.getByTestId(`setup-step-0-continue`).click()
      await checkAlert(page, 'Solid Pod is prepared')
      await page.getByTestId(`setup-step-1-continue`).click()
      await checkAlert(page, 'Joining', false)
      await checkAlert(page, "Request failed: 418 I'm a teapot")
    })

    test('[community is down] should show error', async ({ page }) => {
      const person = await createPerson({
        community,
        skip: ['joinCommunity'],
      })
      const config = await getAppConfig(page)
      await page.route(removeHashFromURI(config.communityId), async route => {
        if (['GET'].includes(route.request().method())) {
          await route.abort('addressunreachable')
        } else await route.fallback()
      })
      await stubDirectMailer(page, { person })
      await signIn(page, person.account)
      await page.getByTestId(`setup-step-0-continue`).click()
      await checkAlert(page, 'Solid Pod is prepared')
      await page.getByTestId(`setup-step-1-continue`).click()
      await checkAlert(page, 'Community Solid Pod is not available', false)
    })
  })

  test.describe('community not joined (new join service)', () => {
    let person: Person
    const inboxUrl = 'https://inbox.community.org/inbox'

    test.beforeEach(async ({ page }) => {
      person = await createPerson({ community, skip: ['joinCommunity'] })
      await stubDirectMailer(page, { person })

      await community.account.authFetch(community.communityUri, {
        method: 'PATCH',
        headers: { 'content-type': 'text/n3' },
        body: `_:addInbox a <${solid.InsertDeletePatch}>;
          <${solid.inserts}> { <${community.communityUri}> <${ldp.inbox}> <${inboxUrl}>. }.`,
      })

      await community.account.authFetch(community.groupAcl, {
        method: 'PUT',
        headers: { 'content-type': 'text/turtle' },
        body: generateAcl(community.groupDoc, [
          {
            permissions: ['Read', 'Write', 'Control'],
            agents: [community.account.webId],
          },
          {
            permissions: ['Read', 'Write'],
            agents: ['https://inbox.community.org/profile/card#bot'],
          },
          { permissions: ['Read'], agentClasses: [foaf.Agent] },
        ]),
      })

      await page.route(inboxUrl, async route => {
        if (route.request().method() !== 'POST') {
          await route.fallback()
          return
        }

        const body = route.request().postDataJSON() as {
          actor?: { id?: string }
        }
        await community.account.authFetch(community.groupUri, {
          method: 'PATCH',
          headers: { 'content-type': 'text/n3' },
          body: `_:insertPerson a <${solid.InsertDeletePatch}>;
            <${solid.inserts}> { <${community.groupUri}> <${vcard.hasMember}> <${body.actor?.id}>. }.`,
        })

        await route.fulfill({
          status: 200,
          headers: {
            location: community.groupUri.toString(),
            'access-control-expose-headers': 'location',
          },
        })
      })

      await signIn(page, person.account)
    })

    test('should send a `Join` activity to community inbox', async ({
      page,
    }) => {
      const joinActivityPromise = page.waitForRequest(
        request => request.method() === 'POST' && request.url() === inboxUrl,
      )
      const groupUpdatePromise = page.waitForRequest(request => {
        return (
          request.method() === 'GET' &&
          request.url() === community.groupDoc.toString()
        )
      })

      await page.getByTestId('setup-step-0-continue').click()
      await page.getByTestId('setup-step-1-continue').click()

      const joinActivity = await joinActivityPromise
      expect(joinActivity.postDataJSON()).toMatchObject({
        actor: { type: 'Person', id: person.account.webId },
        object: { type: 'Group', id: community.communityUri.toString() },
      })

      await groupUpdatePromise
      await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()
    })

    test('[error] should show error message', async ({ page }) => {
      await page.route(inboxUrl, async route => {
        if (route.request().method() === 'POST')
          await route.fulfill({ status: 500 })
      })

      await page.getByTestId(`setup-step-0-continue`).click()
      await checkAlert(page, 'Solid Pod is prepared')
      await page.getByTestId(`setup-step-1-continue`).click()
      await checkAlert(page, 'Joining', false)
      await checkAlert(page, 'Request failed: 500')
    })
  })

  test.describe('webhook email notifications are not integrated', () => {
    let person: Person
    const mailer = 'http://email.notifications.service'

    test.beforeEach(async ({ page }) => {
      person = await createPerson({ community })

      await updateAppConfig(page, {
        emailNotificationsType: 'solid',
        emailNotificationsService: mailer,
      })

      await stubWebhookMailer(page, {
        mailer,
        person,
        integrated: false,
        verified: false,
      })

      await signIn(page, person.account)
    })

    test('should ask for email and integrate notifications', async ({
      page,
    }) => {
      const integrationRequest = page.waitForRequest(
        request =>
          request.method() === 'POST' &&
          request.url() === new URL('inbox', mailer).toString(),
      )

      await page.getByTestId('setup-step-0-continue').click()
      await page.getByTestId('setup-step-1-continue').click()
      await page
        .getByRole('textbox', { name: 'Your email' })
        .fill('asdf@example.com')
      await stubWebhookMailer(page, {
        mailer,
        person,
        integrated: true,
        verified: false,
      })
      await page
        .getByRole('button', { name: 'Send Confirmation Email' })
        .click()

      const request = await integrationRequest
      expect(request.postDataJSON()).toEqual({
        '@id': '',
        '@context': 'https://www.w3.org/ns/activitystreams',
        '@type': 'Add',
        actor: person.account.webId,
        object: person.pod.inbox,
        target: 'asdf@example.com',
      })
      await expect(
        page.getByRole('button', { name: 'Finish Setup' }),
      ).toBeVisible()
      await stubWebhookMailer(page, {
        mailer,
        person,
        integrated: true,
        verified: true,
      })
      await page.getByRole('button', { name: 'Finish Setup' }).click()
      await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()
    })

    test.fixme('should allow custom email notifications service', async () => {})
    test.fixme('should make inbox readable for email notifications service identity', async () => {})

    test('[error] should show error message', async ({ page }) => {
      await page.route(new URL('inbox', mailer).toString(), async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 500 })
        } else {
          await route.fallback()
        }
      })

      await page.getByTestId('setup-step-0-continue').click()
      await page.getByTestId('setup-step-1-continue').click()
      await page
        .getByRole('textbox', { name: 'Your email' })
        .fill('asdf@example.com')
      await page
        .getByRole('button', { name: 'Send Confirmation Email' })
        .click()

      await checkAlert(page, '500 Internal Server Error')
    })
  })

  test.describe('direct email notifications are not integrated', () => {
    const mailer = 'http://localhost:3005'

    const prepareDirectEmailSetup = async ({
      page,
      person,
      mailbot,
      email,
    }: {
      page: Page
      person: Person
      mailbot: Account
      email: string
    }) => {
      await updateAppConfig(page, {
        emailNotificationsType: 'simple',
        emailNotificationsIdentity: mailbot.webId,
      })

      await stubDirectMailer(page, { person, mailer, integrated: false })
      await signIn(page, person.account)

      await page.getByTestId('setup-step-0-continue').click()
      await page.getByTestId('setup-step-1-continue').click()
      await page.getByRole('textbox', { name: 'email address' }).fill(email)
    }

    test('should ask for email and integrate notifications', async ({
      page,
    }) => {
      const person = await createPerson({ community })
      const mailbot = await createRandomAccount()

      await prepareDirectEmailSetup({
        page,
        person,
        mailbot,
        email: 'asdf@example.com',
      })

      const integrationRequest = page.waitForRequest(
        request =>
          request.method() === 'POST' &&
          request.url() === new URL('init', mailer).toString(),
      )

      await page
        .getByRole('button', { name: 'Send Confirmation Email' })
        .click()

      const request = await integrationRequest
      expect(request.postDataJSON()).toEqual({ email: 'asdf@example.com' })
      await expect(
        page.getByText(/confirmation email has been sent/i),
      ).toBeVisible()
      await stubDirectMailer(page, { mailer, person })
      await page.getByRole('button', { name: 'Finish Setup' }).click()
      await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()
    })

    test('should prepare pod for storing email verification', async ({
      page,
    }) => {
      const person = await createPerson({ community })
      const mailbot = await createRandomAccount()

      await prepareDirectEmailSetup({
        page,
        person,
        mailbot,
        email: 'asdf@example.com',
      })

      await page.route('http://localhost:3005/init', async route => {
        await route.fulfill({ status: 200 })
      })
      const integrationRequest = page.waitForRequest(
        request =>
          request.method() === 'POST' &&
          request.url() === 'http://localhost:3005/init',
      )

      await page
        .getByRole('button', { name: 'Send Confirmation Email' })
        .click()

      await integrationRequest
      await expect(
        page.getByText(/confirmation email has been sent/i),
      ).toBeVisible()

      const hospexUrl = person.pod.hospexProfile
      const hospexResponse = await mailbot.authFetch(hospexUrl, {
        method: 'GET',
      })
      expect(hospexResponse.status).toBe(200)
      const hospexBody = await hospexResponse.text()

      const store = new Store(
        new Parser({ baseIRI: hospexUrl }).parse(hospexBody),
      )
      const settings = store
        .getObjects(person.account.webId, space.preferencesFile, null)
        .map(setting => setting.value)

      expect(settings).toHaveLength(1)

      const mailerConfig = settings[0]
      const settingsResponse = await mailbot.authFetch(mailerConfig, {
        method: 'GET',
      })
      expect(settingsResponse.status).toBe(200)

      const patchResponse = await mailbot.authFetch(mailerConfig, {
        method: 'PATCH',
        headers: { 'content-type': 'text/n3' },
        body: `_:mutate a <${solid.InsertDeletePatch}>;
          <${solid.inserts}> { <#this> a <#test>. }.`,
      })
      expect(patchResponse.status).toBeGreaterThanOrEqual(200)
      expect(patchResponse.status).toBeLessThan(300)
    })

    test('should not overwrite other email service settings in the pod', async ({
      page,
    }) => {
      const person = await createPerson({ community })
      const mailbot = await createRandomAccount()
      const mailbot2 = await createRandomAccount()
      const otherCommunity = await createCommunity({ name: 'Other Community' })

      await updateAppConfig(page, {
        emailNotificationsType: 'simple',
        emailNotificationsIdentity: mailbot2.webId,
        communityContainer: 'other-community',
        communityId: otherCommunity.communityUri,
      })

      await stubDirectMailer(page, { person, integrated: false })
      await signIn(page, person.account)
      await expect(
        page.getByRole('link', { name: 'Other Community' }),
      ).toBeVisible()

      await page.getByTestId('setup-step-0-continue').click()
      await page
        .getByRole('radio', { name: 'hospex/test-community/card' })
        .check()
      await page.getByTestId('setup-step-1-continue').click()

      await page
        .getByPlaceholder('email address')
        .fill('other-email@example.com')
      const integrationRequestOther = page.waitForRequest(
        request =>
          request.method() === 'POST' &&
          request.url() === 'http://localhost:3005/init' &&
          request.postDataJSON()?.email === 'other-email@example.com',
      )
      await page
        .getByRole('button', { name: 'Send Confirmation Email' })
        .click()
      await integrationRequestOther
      await expect(
        page.getByText(/confirmation email has been sent/i),
      ).toBeVisible()

      await signOut(page)

      await updateAppConfig(page, {
        emailNotificationsType: 'simple',
        emailNotificationsIdentity: mailbot.webId,
        communityId: community.communityUri,
        communityContainer: 'dev-solidcouch',
      })

      await signIn(page, person.account)
      await expect(
        page.getByRole('link', { name: 'communityName' }),
      ).toBeVisible()
      await page.getByTestId('setup-step-0-continue').click()
      await page.getByTestId('setup-step-1-continue').click()
      await page
        .getByPlaceholder('email address')
        .fill('third-email@example.com')
      const integrationRequestCurrent = page.waitForRequest(
        request =>
          request.method() === 'POST' &&
          request.url() === 'http://localhost:3005/init' &&
          request.postDataJSON()?.email === 'third-email@example.com',
      )
      await page
        .getByRole('button', { name: 'Send Confirmation Email' })
        .click()
      await integrationRequestCurrent
      await expect(
        page.getByText(/confirmation email has been sent/i),
      ).toBeVisible()

      const hospexUrl = person.pod.hospexProfile

      const accessDocument = async (url: string, bot: Account) =>
        bot.authFetch(url, { method: 'GET' })

      const hospexResponse1 = await accessDocument(hospexUrl, mailbot)
      const hospexResponse2 = await accessDocument(hospexUrl, mailbot2)

      expect(hospexResponse1.status).toBe(200)
      expect(hospexResponse2.status).toBe(200)
      const hospexBody1 = await hospexResponse1.text()
      const hospexBody2 = await hospexResponse2.text()
      expect(hospexBody1).toEqual(hospexBody2)

      const store = new Store(
        new Parser({ baseIRI: hospexUrl }).parse(hospexBody1),
      )
      const settings = store
        .getObjects(person.account.webId, space.preferencesFile, null)
        .map(setting => setting.value)

      expect(settings).toHaveLength(2)

      const [settings1, settings2] = settings
      const mailbotSettings1 = await accessDocument(settings1, mailbot)
      const mailbotSettings2 = await accessDocument(settings2, mailbot)
      const mailbot2Settings1 = await accessDocument(settings1, mailbot2)
      const mailbot2Settings2 = await accessDocument(settings2, mailbot2)

      expect([200, 403]).toContain(mailbotSettings1.status)
      expect(mailbotSettings2.status).toBe(
        mailbotSettings1.status === 200 ? 403 : 200,
      )
      expect(mailbot2Settings1.status).toBe(
        mailbotSettings1.status === 200 ? 403 : 200,
      )
      expect(mailbot2Settings2.status).toBe(
        mailbotSettings1.status === 200 ? 200 : 403,
      )

      const assertReadWriteAccess = (response: Response) => {
        const allow = response.headers.get('wac-allow')
        expect(allow).toBe('user="append read write"')
      }

      if (mailbotSettings1.status === 200)
        assertReadWriteAccess(mailbotSettings1)
      if (mailbotSettings2.status === 200)
        assertReadWriteAccess(mailbotSettings2)
      if (mailbot2Settings1.status === 200)
        assertReadWriteAccess(mailbot2Settings1)
      if (mailbot2Settings2.status === 200)
        assertReadWriteAccess(mailbot2Settings2)
    })

    test('[error] should show error message', async ({ page }) => {
      const person = await createPerson({ community })
      const mailbot = await createRandomAccount()

      await updateAppConfig(page, {
        emailNotificationsType: 'simple',
        emailNotificationsIdentity: mailbot.webId,
      })

      await stubDirectMailer(page, { person, mailer, integrated: false })
      await signIn(page, person.account)

      await page.route(new URL('init', mailer).toString(), async route => {
        await route.fulfill({ status: 418 })
      })

      await page.getByTestId('setup-step-0-continue').click()
      await page.getByTestId('setup-step-1-continue').click()
      await page
        .getByRole('textbox', { name: 'email address' })
        .fill('asdf@example.com')

      await page
        .getByRole('button', { name: 'Send Confirmation Email' })
        .click()

      await checkAlert(page, "418 I'm a teapot")
    })
  })

  test.describe('everything is missing', () => {
    let person: Person
    const mailer = 'http://localhost:3005'

    test.beforeEach(async ({ page }) => {
      person = await createPerson({
        community,
        skip: [
          'personalHospexDocument',
          'joinCommunity',
          'publicTypeIndex',
          'privateTypeIndex',
          'inbox',
        ],
      })

      const mailbot = await createRandomAccount()
      await updateAppConfig(page, {
        emailNotificationsType: 'simple',
        emailNotificationsIdentity: mailbot.webId,
      })
    })

    test('should set up everything', async ({ page }) => {
      await stubDirectMailer(page, { person, mailer, integrated: false })
      await signIn(page, person.account)

      const addUserToCommunityPromise = page.waitForRequest(
        request =>
          request.method() === 'PATCH' &&
          request.url() === community.groupDoc.toString(),
      )

      await page.getByTestId('setup-step-0-continue').click()
      await page.getByTestId('setup-step-1-continue').click()

      await page
        .getByRole('textbox', { name: 'email address' })
        .fill('asdf@example.com')

      const integrationPromise = page.waitForRequest(
        request =>
          request.method() === 'POST' &&
          request.url() === new URL('init', mailer).toString(),
      )

      // Stub successful verification before clicking
      await stubDirectMailer(page, { person, mailer })
      await page
        .getByRole('button', { name: 'Send Confirmation Email' })
        .click()

      await addUserToCommunityPromise
      const integrationRequest = await integrationPromise
      expect(integrationRequest.postDataJSON()).toEqual({
        email: 'asdf@example.com',
      })

      await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()
    })
  })

  test.describe('person joined another community', () => {
    let person: Person
    let otherCommunity: Community

    test.beforeEach(async () => {
      otherCommunity = await createCommunity({ name: 'Other Community' })

      // Create person fully set up for other community
      person = await createPerson({
        community: otherCommunity,
        hospexContainerName: 'other-community',
      })

      // Set up partial state for current community (missing these items)
      await createPerson({
        community,
        account: person.account, // reuse same account
        skip: [
          'personalHospexDocument',
          'joinCommunity',
          'publicTypeIndex',
          'privateTypeIndex',
          'inbox',
        ],
      })
    })

    test('should show option to create a new community folder, and join this community just fine', async ({
      page,
    }) => {
      const config = await getAppConfig(page)

      await stubDirectMailer(page, { person })
      await signIn(page, person.account)

      await page.getByTestId('setup-step-0-continue').click()
      await page.getByRole('radio', { name: config.communityContainer }).check()
      await page.getByTestId('setup-step-1-continue').click()

      await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()
    })

    test('should show option to choose existing community folder, and not break it when adding the community', async ({
      page,
    }) => {
      await stubDirectMailer(page, { person })
      await signIn(page, person.account)

      await page.getByTestId('setup-step-0-continue').click()
      await page
        .getByRole('radio', {
          name: `hospex/other-community/card`,
        })
        .check()
      await page.getByTestId('setup-step-1-continue').click()

      await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()

      // Check that both communities still have access
      const aclUrl = `${person.account.podUrl}hospex/other-community/.acl`
      const aclResponse = await person.account.authFetch(aclUrl, {
        method: 'GET',
      })
      expect(aclResponse.status).toBe(200)

      const aclBody = await aclResponse.text()

      const acls = processAcl(aclUrl, aclBody)

      const readAcl = acls.find(
        acl => acl.modes.length === 1 && acl.modes[0] === 'Read',
      )

      expect(readAcl).toBeTruthy()
      expect(readAcl!.agentGroups).toHaveLength(2)
      expect(readAcl!.agentGroups).toContain(community.groupUri.toString())
      expect(readAcl!.agentGroups).toContain(otherCommunity.groupUri.toString())

      const hospexUrl = `${person.account.podUrl}hospex/other-community/card`
      const hospexResponse = await person.account.authFetch(hospexUrl, {
        method: 'GET',
      })
      expect(hospexResponse.status).toBe(200)

      const hospexBody = await hospexResponse.text()
      const parser = new Parser({ baseIRI: hospexUrl })
      const store = new Store(parser.parse(hospexBody))

      const communities = store
        .getObjects(person.account.webId, sioc.member_of, null)
        .map(obj => obj.value)

      expect(communities).toHaveLength(2)
      expect(communities).toContain(community.communityUri.toString())
      expect(communities).toContain(otherCommunity.communityUri.toString())
    })

    test.fixme('should explain implications of choosing other community folder', async () => {})
    test.fixme('should not break email notifications of the other community', async () => {})
  })
})
