import { expect, test } from '@playwright/test'
import { foaf, ldp, solid, vcard } from 'rdf-namespaces'
import { generateAcl } from '../cypress/support/helpers/acl'
import {
  createPerson,
  signIn,
  SkipOptions,
  type Person,
} from './helpers/account'
import { setupCommunity, type Community } from './helpers/community'
import { stubDirectMailer, stubWebhookMailer } from './helpers/mailer'

test.describe('Setup Solid pod', () => {
  let community: Community
  test.beforeEach(async ({ page }) => {
    community = await setupCommunity(page, { name: 'communityName' })
  })

  test.beforeEach(async ({ page }) => {
    await stubDirectMailer(page)
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
      { item: 'public type index', skip: ['publicTypeIndex'], steps: 1 },
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

  test.describe('community not joined (new join service)', () => {
    let person: Person
    const inboxUrl = 'https://inbox.community.org/inbox'

    test.beforeEach(async ({ page }) => {
      person = await createPerson({ community, skip: ['joinCommunity'] })

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
  })

  test.describe('webhook email notifications are not integrated', () => {
    let person: Person
    const mailer = 'http://email.notifications.service'

    test.beforeEach(async ({ page }) => {
      person = await createPerson({ community })

      await page.goto('/')
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
      await page.evaluate(
        `globalThis.updateAppConfig({ emailNotificationsType: 'solid', emailNotificationsService: '${mailer}' })`,
      )

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
  })

  test.describe('email notifications with simple-email-notifications are not integrated', () => {
    test.fixme('should ask for email and integrate notifications', async () => {})
    test.fixme('should prepare pod for storing email verification', async () => {})
    test.fixme('should not overwrite other email service settings in the pod', async () => {})
  })

  test.describe('everything is missing', () => {
    test.fixme('should set up everything', async () => {})
  })

  test.describe('person joined another community', () => {
    test.fixme('should show option to create a new community folder, and join this community just fine', async () => {})
    test.fixme('should show option to choose existing community folder, and not break it when adding the community', async () => {})
    test.fixme('should explain implications of choosing other community folder', async () => {})
    test.fixme('should not break email notifications of the other community', async () => {})
  })
})
