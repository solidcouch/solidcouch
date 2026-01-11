import type { Page } from '@playwright/test'
import { Person } from './account'

export const stubDirectMailer = async (page: Page) => {
  await page.route('http://localhost:3005/status/*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emailVerified: true }),
    })
  })

  await page.route('http://localhost:3005/notification', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
    })
  })
}

export const stubWebhookMailer = async (
  page: Page,
  {
    mailer,
    person,
    verified = true,
    integrated = true,
  }: {
    mailer?: string
    person: Person
    integrated?: boolean
    verified?: boolean
  },
) => {
  const matcher = new URL('*', mailer ?? 'http://localhost:3005').toString()

  await page.route(matcher, async route => {
    const url = route.request().url()
    const method = route.request().method()
    if (url.endsWith('status') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          actor: person.account.webId,
          integrations: integrated
            ? [
                {
                  object: person.pod.inbox,
                  target: 'asdf@example.com',
                  verified,
                },
              ]
            : [],
        }),
      })
    } else if (url.endsWith('inbox') && method === 'POST') {
      await route.fulfill({ status: 200 })
    } else {
      await route.fallback()
    }
  })
}
