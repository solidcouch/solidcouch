import { expect, test } from '@playwright/test'
import encodeURIComponent from 'strict-uri-encode'
import { createPerson, signIn, signOut, type Person } from './helpers/account'
import { setupCommunity, type Community } from './helpers/community'
import { saveContacts } from './helpers/contacts'
import { stubMailer } from './helpers/mailer'

test.describe("person's contacts", () => {
  let community: Community
  let people: Person[]

  // create community and people
  test.beforeEach(async ({ page }) => {
    community = await setupCommunity(page, {
      name: 'Community' + Date.now(),
      about: 'About Community' + Date.now(),
      pun: 'Punn',
    })
    people = await Promise.all(
      Array(5)
        .fill(0)
        .map(() => createPerson({ community })),
    )
  })

  // set up relationships between people
  test.beforeEach(async () => {
    // 1 means create contact
    // 2 means create notification
    const contacts = [
      [0, 0, 1, 0, 1],
      [0, 0, 1, 1, 1],
      [1, 1, 0, 0, 0],
      [3, 1, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ]
    await Promise.all(
      contacts.map(
        async (c, i) =>
          await saveContacts({
            person: people[i],
            contacts: people.filter((_, i) => c[i] & 1),
            notifications: people.filter((_, i) => c[i] & 2),
          }),
      ),
    )
  })

  // stub mailer
  test.beforeEach(async ({ page }) => {
    await stubMailer(page)
  })

  // sign in
  test.beforeEach(async ({ page }) => {
    await signIn(page, people[0].account)
  })

  test.fixme('show my contacts, including unconfirmed and pending', () => {})

  test("show other person's confirmed (2-directional) contacts", async ({
    page,
  }) => {
    const [, person1, person2, person3, person4] = people

    await page.goto(
      `/profile/${encodeURIComponent(person1.account.webId)}/contacts`,
    )

    const contactList = page.getByTestId('contact-list')
    await expect(contactList).toBeVisible()

    const contacts = contactList.getByTestId('contact')
    await expect(contacts).toHaveCount(2)

    await expect(contactList).toContainText(person2.profile.name)
    await expect(contactList).toContainText(person3.profile.name)
    await expect(contactList).not.toContainText(person4.profile.name)

    await expect(
      contactList.locator(
        `a[href="/profile/${encodeURIComponent(person2.account.webId)}"]`,
      ),
    ).toBeVisible()
    await expect(
      contactList.locator(
        `a[href="/profile/${encodeURIComponent(person3.account.webId)}"]`,
      ),
    ).toBeVisible()
  })

  test('allow adding other person as contact and send contact request notification', async ({
    page,
  }) => {
    const [me, other] = people
    const invitation = 'Contact invitation text'

    const notificationPromise = page.waitForRequest(
      request =>
        request.method() === 'POST' &&
        request.url().startsWith(other.pod.inbox),
    )
    const grantHospexAccessPromise = page.waitForRequest(
      request =>
        request.method() === 'PATCH' &&
        request.url().startsWith(`${me.pod.hospexContainer}.acl`),
    )

    await page.goto(`/profile/${encodeURIComponent(other.account.webId)}`)
    await page.getByRole('button', { name: 'Add to my contacts' }).click()
    await page.locator('textarea[name="invitation"]').fill(invitation)
    await page.getByRole('button', { name: 'Send contact invitation' }).click()

    await expect(page.getByText('Contact request sent')).toBeVisible()

    const notificationRequest = await notificationPromise
    expect(notificationRequest.postData()).toContain(invitation)
    await grantHospexAccessPromise

    await signOut(page)
    await signIn(page, other.account)

    await page.goto(`/profile/${encodeURIComponent(me.account.webId)}`)
    await page.getByRole('button', { name: 'See contact invitation' }).click()

    const deleteNotificationPromise = page.waitForRequest(
      request =>
        request.method() === 'DELETE' &&
        request.url().startsWith(other.pod.inbox),
    )

    await page.getByRole('button', { name: 'Accept' }).click()
    await deleteNotificationPromise
    await expect(page.getByText('Contact exists')).toBeVisible()
  })

  test.fixme('give contacts access to my hospex', () => {})
  test.fixme('allow removing other person from contacts', () => {})

  test('allow confirming other person as contact from their profile', async ({
    page,
  }) => {
    const [me, , , person3] = people

    await page.goto(`/profile/${encodeURIComponent(person3.account.webId)}`)
    await page.getByRole('button', { name: 'See contact invitation' }).click()

    const deleteNotificationPromise = page.waitForRequest(
      request =>
        request.method() === 'DELETE' && request.url().startsWith(me.pod.inbox),
    )

    await page.getByRole('button', { name: 'Accept' }).click()
    await deleteNotificationPromise
    await expect(page.getByText('Contact exists')).toBeVisible()
  })

  // TODO this test is flaky. It regularly fails in GitHub actions with Firefox
  test('allow confirming other person as contact from my list of contacts', async ({
    page,
  }) => {
    const [me, , , person3] = people

    await page.goto(`/profile/${encodeURIComponent(me.account.webId)}/contacts`)

    const contactList = page.getByTestId('contact-list')
    const contactItem = contactList
      .getByTestId('contact')
      .filter({ hasText: person3.profile.name })

    await expect(contactItem).toContainText('pending')
    await contactItem.getByRole('button', { name: 'process' }).click()

    const deleteNotificationPromise = page.waitForRequest(
      request =>
        request.method() === 'DELETE' && request.url().startsWith(me.pod.inbox),
    )
    await page.getByRole('button', { name: 'Accept' }).click()
    await deleteNotificationPromise
    await expect(contactItem).not.toContainText('pending')
  })

  test('allow ignoring contact request', async ({ page }) => {
    const [me, , , person3] = people

    await page.goto(`/profile/${encodeURIComponent(person3.account.webId)}`)
    await page.getByRole('button', { name: 'See contact invitation' }).click()

    const deleteNotificationPromise = page.waitForRequest(
      request =>
        request.method() === 'DELETE' && request.url().startsWith(me.pod.inbox),
    )

    await page.getByRole('button', { name: 'Ignore' }).click()
    await deleteNotificationPromise
    await expect(
      page.getByRole('button', { name: 'Add to my contacts' }),
    ).toBeVisible()
  })

  test.fixme('ignore fake contacts (not published by correct person)', () => {})
  test.fixme('show number of contact requests in user menu', () => {})
})
