import type { Page } from '@playwright/test'
import strict_uri_encode from 'strict-uri-encode'
import { Person } from './account'

export const stubDirectMailer = async (
  page: Page,
  {
    mailer = 'http://localhost:3005',
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
  await page.route(
    new URL(
      `status/${strict_uri_encode(person.account.webId)}`,
      mailer,
    ).toString(),
    async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ emailVerified: integrated && verified }),
      })
    },
  )

  await page.route(new URL('notification', mailer).toString(), async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
    })
  })

  await page.route(new URL('init', mailer).toString(), async route => {
    await route.fulfill({ status: 200 })
  })
}

export const stubWebhookMailer = async (
  page: Page,
  {
    mailer = 'http://localhost:3005',
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
  await page.route(new URL('status', mailer).toString(), async route => {
    if (route.request().method() === 'GET') {
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
    } else {
      await route.fallback()
    }
  })

  await page.route(new URL('inbox', mailer).toString(), async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200 })
    } else {
      await route.fallback()
    }
  })
}
