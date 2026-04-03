import { expect, test } from '@playwright/test'
import path from 'path'
import { type Community, setupCommunity } from './helpers/community'

const terms = `
This community is provided as-is.

There is no support.
`

const communityData = {
  name: 'name' + Math.floor(Math.random() * 1000),
  about: 'about this community - Lorem Ipsum Dolor sic amet',
  pun: 'This is a tagline',
  logo: path.join(import.meta.dirname, 'assets/testlogo.png'),
  terms,
}

test.describe('Information about community', () => {
  let community: Community

  // reset the app
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('contentinfo')).toContainText('WIP')
    await page.evaluate(`globalThis.resetAppConfig()`)
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
  })

  test.beforeEach(async ({ page }) => {
    community = await setupCommunity(page, communityData)
  })

  test('should show linked data about community on homepage', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByText(communityData.name)).toBeVisible()
    await expect(page.getByText(communityData.about)).toBeVisible()
    await expect(page.getByText(communityData.pun)).toBeVisible()
    expect(community.logo).toBeTruthy()
    await expect(
      page.getByRole('img', { name: `logo of ${community.name}` }),
    ).toHaveAttribute('src', community.logo!)
  })

  test('should show link to privacy notice on homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      /\/privacy$/,
    )

    await page.goto('/privacy')

    await expect(
      page.getByRole('heading', { name: 'Privacy notice' }),
    ).toBeVisible()
  })

  test('should show link to community terms of service on homepage (if defined)', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(
      page.getByRole('link', { name: 'Community Terms' }),
    ).toHaveAttribute('href', /\/terms$/)

    await page.getByRole('link', { name: 'Community Terms' }).click()

    await expect(
      page.getByRole('heading', { name: 'Community Terms' }),
    ).toBeVisible()

    expect(community.terms).toBeTruthy()
    await expect(page.getByText(community.terms!)).toBeVisible()
  })
})
