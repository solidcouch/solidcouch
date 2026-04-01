import { expect, test } from '@playwright/test'
import path from 'path'
import { setupCommunity } from './helpers/community'

test.describe('Information about community', () => {
  test('should show linked data about community on homepage', async ({
    page,
  }) => {
    const communityData = {
      name: 'name' + Math.floor(Math.random() * 1000),
      about: 'about this community - Lorem Ipsum Dolor sic amet',
      pun: 'This is a tagline',
      logo: path.join(import.meta.dirname, 'assets/testlogo.png'),
    }

    await setupCommunity(page, communityData)

    await page.goto('/')

    await expect(page.getByText(communityData.name)).toBeVisible()
    await expect(page.getByText(communityData.about)).toBeVisible()
    await expect(page.getByText(communityData.pun)).toBeVisible()
  })
})
