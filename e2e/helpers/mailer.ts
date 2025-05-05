import type { Page } from '@playwright/test'

export const stubMailer = async (page: Page) => {
  await page.route('http://localhost:3005/status/*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emailVerified: true }),
    })
  })

  await page.route('http://localhost:3005/notification', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
    })
  })
}
