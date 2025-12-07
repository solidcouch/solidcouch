import { expect, Page, test } from '@playwright/test'
import {
  default as encodeURIComponent,
  default as strict_uri_encode,
} from 'strict-uri-encode'
import { createPerson, signIn, signOut } from './helpers/account'
import { setupCommunity } from './helpers/community'
import { stubMailer } from './helpers/mailer'

test.describe('Messages', () => {
  let community: Awaited<ReturnType<typeof setupCommunity>>
  let people: Awaited<ReturnType<typeof createPerson>>[] = []

  // reset the app
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('contentinfo')).toContainText('WIP')
    await page.evaluate(`globalThis.resetAppConfig()`)
    await expect(page.locator('span')).toContainText('Home')
  })

  // set up community
  test.beforeEach(async ({ page }) => {
    community = await setupCommunity(page, {
      name: 'Community' + Date.now(),
      about: 'About Community' + Date.now(),
      pun: 'Punn',
    })
  })

  // set up participants
  test.beforeEach(async () => {
    people = [
      await createPerson({ community }),
      await createPerson({ community }),
    ]
  })

  // stub mailer
  test.beforeEach(async ({ page }) => {
    await stubMailer(page)
  })

  test('messages test', async ({ page }) => {
    const [person0, person1] = people

    // first person writes message to the second
    await signIn(page, person0.account)

    await page.goto(`/profile/${encodeURIComponent(person1.account.webId)}`)

    await page.getByRole('link', { name: 'Write a message' }).click()
    await expect(page).toHaveURL(
      `/messages-with/${encodeURIComponent(person1.account.webId)}`,
    )
    await page.getByRole('link', { name: 'Start a new conversation' }).click()
    await expect(page).toHaveURL(
      `/messages-with/${encodeURIComponent(person1.account.webId)}/new`,
    )
    await page.getByRole('textbox', { name: 'Title' }).fill('Test title')
    await page.getByRole('textbox', { name: 'Message' }).fill('Test message!')
    await page.getByRole('button', { name: 'Send' }).click()
    await checkAndCloseAlert(page, 'Message was created')
    await checkAndCloseAlert(page, 'Linked Data Notification was sent')
    await checkAndCloseAlert(page, 'Email notification was sent')
    await expect(page.getByTestId('message-0-from-me')).toContainText(
      'Test message!',
    )

    const chatUrl = decodeURIComponent(page.url().split('/').pop()!)

    await signOut(page)

    // second person reads the message and writes back
    await signIn(page, person1.account)

    await page.getByRole('link', { name: 'messages (1 new)' }).click()

    const thread = page.getByRole('link', {
      name: `Messages with ${person0.profile.name}`,
    })

    await expect(page.getByRole('heading')).toContainText('Conversations')
    await expect(thread).toContainText('Test message!')
    await thread.click()

    await expect(page).toHaveURL(`/messages/${encodeURIComponent(chatUrl)}`)

    await expect(page.getByTestId('message-0-to-me')).toContainText(
      'Test message!',
    )

    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByRole('textbox').fill('Hello there!')
    await page.getByRole('button', { name: 'Send' }).click()
    await checkAndCloseAlert(page, 'Message was created')
    await checkAndCloseAlert(page, 'Linked Data Notification was sent')
    await checkAndCloseAlert(page, 'Email notification was sent')
    await expect(page.getByTestId('message-1-from-me')).toContainText(
      'Hello there!',
    )

    await page.getByRole('textbox').fill('another message')
    await page.getByRole('button', { name: 'Send' }).click()
    await checkAndCloseAlert(page, 'Message was created')
    await checkAndCloseAlert(page, 'Linked Data Notification was sent')
    await checkAndCloseAlert(page, 'Email notification was sent')
    await expect(page.getByTestId('message-2-from-me')).toContainText(
      'another message',
    )

    await signOut(page)

    // first person reads the messages again
    await signIn(page, person0.account)
    await page.getByRole('link', { name: 'messages (2 new)' }).click()
    await page
      .getByRole('link', { name: `Messages with ${person1.profile.name}` })
      .click()
    await expect(page.getByTestId('message-1-to-me')).toContainText(
      'Hello there!',
    )
    await expect(page.getByTestId('message-2-to-me')).toContainText(
      'another message',
    )
  })

  test('unread messages', async ({ page }) => {
    test.setTimeout(360_000)
    const [person0, person1] = people
    await signIn(page, person0.account)

    await page.goto(`/profile/${encodeURIComponent(person1.account.webId)}`)

    await page.getByRole('link', { name: 'Write a message' }).click()
    await expect(page).toHaveURL(
      `/messages-with/${encodeURIComponent(person1.account.webId)}`,
    )
    await page.getByRole('link', { name: 'Start a new conversation' }).click()
    await expect(page).toHaveURL(
      `/messages-with/${encodeURIComponent(person1.account.webId)}/new`,
    )
    await page.getByRole('textbox', { name: 'Title' }).fill('Test title')
    await page.getByRole('textbox', { name: 'Message' }).fill('Test message!')
    await page.getByRole('button', { name: 'Send' }).click()
    await checkAndCloseAlert(page, 'Linked Data Notification was sent')
    await expect(page.getByTestId('message-0-from-me')).toContainText(
      'Test message!',
    )

    const chatUrl = decodeURIComponent(page.url().split('/').pop()!)
    expect(new URL(page.url()).pathname).toEqual(
      `/messages/${strict_uri_encode(chatUrl)}`,
    )

    await signOut(page)

    // second person reads the message and writes back
    await signIn(page, person1.account)

    await page.getByRole('link', { name: 'messages (1 new)' }).click()

    const thread = page.getByRole('link', {
      name: `Messages with ${person0.profile.name}`,
    })

    await expect(page.getByRole('heading')).toContainText('Conversations')
    await expect(thread).toContainText('Test message!')
    await thread.click()

    await expect(page).toHaveURL(`/messages/${encodeURIComponent(chatUrl)}`)

    await expect(page.getByTestId('message-0-to-me')).toContainText(
      'Test message!',
    )
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByRole('textbox').fill('Hello there!')
    await page.getByRole('button', { name: 'Send' }).click()
    await checkAndCloseAlert(page, 'Linked Data Notification was sent')
    await expect(page.getByTestId('message-1-from-me')).toContainText(
      'Hello there!',
    )

    await page.getByRole('textbox').fill('another message')
    await page.getByRole('button', { name: 'Send' }).click()
    await checkAndCloseAlert(page, 'Linked Data Notification was sent')
    await expect(page.getByTestId('message-2-from-me')).toContainText(
      'another message',
    )
    await page.waitForTimeout(5000)

    await page.goto('/')
    await expect(page.getByTestId('message-count-loading')).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'messages' }),
    ).not.toContainText('new')

    await signOut(page)

    // first person reads the messages again
    await signIn(page, person0.account)
    await page.getByRole('link', { name: 'messages (2 new)' }).click()
    await page
      .getByRole('link', { name: `Messages with ${person1.profile.name}` })
      .click()
    await expect(page.getByTestId('message-1-to-me')).toContainText(
      'Hello there!',
    )
    await expect(page.getByTestId('message-2-to-me')).toContainText(
      'another message',
    )

    await page.waitForTimeout(1000)

    await page.goto('/')
    await page.waitForTimeout(500)
    await expect(page.getByTestId('message-count-loading')).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'messages' }),
    ).not.toContainText('new')
  })
})

const checkAndCloseAlert = async (page: Page, text: string) => {
  const alertLocator = page.getByRole('alert').filter({ hasText: text })

  await expect(alertLocator).toBeVisible()
  await alertLocator
    .locator('xpath=..')
    .getByRole('button', { name: 'close' })
    .click()
}
