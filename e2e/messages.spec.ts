import { expect, Page, test } from '@playwright/test'
import encodeURIComponent from 'strict-uri-encode'
import { createPerson, signIn, signOut } from './helpers/account'
import { setupCommunity } from './helpers/community'
import { stubMailer } from './helpers/mailer'

test('messages test', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('contentinfo')).toContainText('WIP')
  await page.evaluate(`globalThis.resetAppConfig()`)
  await expect(page.locator('span')).toContainText('Home')
  const community = await setupCommunity(page, {
    name: 'Community' + Date.now(),
    about: 'About Community' + Date.now(),
    pun: 'Punn',
  })

  await stubMailer(page)

  const person0 = await createPerson({ community })
  const person1 = await createPerson({ community })

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

const checkAndCloseAlert = async (page: Page, text: string) => {
  const alertLocator = page.getByRole('alert').filter({ hasText: text })

  await expect(alertLocator).toBeVisible()
  await alertLocator
    .locator('xpath=..')
    .getByRole('button', { name: 'close' })
    .click()
}
