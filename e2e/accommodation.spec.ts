// tests migrated from Cypress with a significant use of claude-opus-4-5-20251101-thinking-32k

import { expect, Page, test } from '@playwright/test'
import { addAccommodation } from './helpers/accommodation'
import { createPerson, signIn, type Person } from './helpers/account'
import { setupCommunity, type Community } from './helpers/community'
import { checkAlert, updateAppConfig } from './helpers/helpers'
import { stubDirectMailer } from './helpers/mailer'

// Types
type Move = 'l' | 'r' | 'u' | 'd' | 'i' | 'o'

const moveDict: Record<Move, string> = {
  l: 'ArrowLeft',
  r: 'ArrowRight',
  u: 'ArrowUp',
  d: 'ArrowDown',
  i: '+',
  o: '-',
}

// Helper: move the map in accommodation form
const moveFormMap = async (page: Page, moves: Move[]) => {
  // Wait for map container to be visible
  const mapControl = page
    .getByTestId('accommodation-form')
    .locator('.accommodation-map-container-edit .leaflet-control-container')

  await expect(mapControl).toHaveCount(1)

  // Wait a bit to make really sure map has loaded
  await page.waitForTimeout(1000)

  // Focus the map container
  const map = page
    .getByTestId('accommodation-form')
    .locator('.accommodation-map-container-edit')
  await expect(map).toHaveCount(1)
  await map.last().focus()

  // Press keys with delays
  for (const move of moves) {
    await page.waitForTimeout(500)
    await page.keyboard.press(moveDict[move])
  }
}

// Helper: navigate to offers page
const goToOffers = async (page: Page) => {
  await page.getByRole('link', { name: 'host' }).click()
  await expect(page).toHaveURL('/host/offers')
}

test.describe('accommodations offered by person', () => {
  let community: Community
  let person: Person

  test.beforeEach(async ({ page }) => {
    // Create and setup community
    community = await setupCommunity(page)

    // Create person
    person = await createPerson({ community })

    // Add 3 accommodations
    await addAccommodation(person, {
      description: { en: 'accommodation 1' },
      location: [50, 16],
    })
    await addAccommodation(person, {
      description: { en: 'accommodation 2' },
      location: [51, 17],
    })
    await addAccommodation(person, {
      description: { en: 'accommodation 3' },
      location: [52, 18],
    })

    // Stub mailer and sign in
    await stubDirectMailer(page, { person })
    await signIn(page, person.account)

    // Go to offers page
    await goToOffers(page)
  })

  test('should be able to navigate to my offers page from user menu', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByTestId('user-menu-trigger').click()
    await page.getByRole('link', { name: 'my hosting' }).click()
    await expect(page).toHaveURL('/host/offers')
  })

  // TODO maybe: not sure about this
  test.fixme('should be able to see accommodations of other person', async () => {})

  test('should be able to see accommodations offered by me', async ({
    page,
  }) => {
    const items = page.getByTestId('offer-accommodation-item')
    await expect(items).toHaveCount(3)
    await expect(items.filter({ hasText: 'accommodation 1' })).toBeVisible()
    await expect(items.filter({ hasText: 'accommodation 2' })).toBeVisible()
    await expect(items.filter({ hasText: 'accommodation 3' })).toBeVisible()
  })

  test('should be able to add a new accommodation', async ({ page }) => {
    await expect(page.getByTestId('offer-accommodation-item')).toHaveCount(3)
    await page.getByRole('button', { name: 'Add Accommodation' }).click()

    await moveFormMap(page, ['l', 'u', 'i', 'l', 'l'])

    await page
      .locator("textarea[name='description.en']")
      .fill('This is a new description in English')
    await page.getByRole('button', { name: 'Save' }).click()

    await checkAlert(page, 'Creating accommodation', false)
    await checkAlert(page, 'Accommodation created')

    const items = page.getByTestId('offer-accommodation-item')
    await expect(items).toHaveCount(4)
    await expect(
      items.filter({ hasText: 'This is a new description in English' }),
    ).toBeVisible()
  })

  test("should encounter validation error when location hasn't been moved", async ({
    page,
  }) => {
    await expect(page.getByTestId('offer-accommodation-item')).toHaveCount(3)
    await page.getByRole('button', { name: 'Add Accommodation' }).click()

    // Don't move the map - pass empty array
    await moveFormMap(page, [])

    await page
      .locator("textarea[name='description.en']")
      .fill('This is a new description in English')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(
      page.getByText('Please move map to your hosting location'),
    ).toBeVisible()
  })

  test('should encounter validation error when description is empty', async ({
    page,
  }) => {
    await expect(page.getByTestId('offer-accommodation-item')).toHaveCount(3)
    await page.getByRole('button', { name: 'Add Accommodation' }).click()

    await moveFormMap(page, ['l', 'u', 'i'])

    // Don't fill description, just save
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('This field is required')).toBeVisible()
  })

  test('should be able to edit location and description of accommodation', async ({
    page,
  }) => {
    await page
      .getByTestId('offer-accommodation-item')
      .filter({ hasText: 'accommodation 2' })
      .getByRole('button', { name: 'Edit' })
      .click()

    const descriptionTextarea = page.locator("textarea[name='description.en']")
    await descriptionTextarea.clear()
    await descriptionTextarea.fill('changed second accommodation')

    await moveFormMap(page, ['o', 'o', 'l', 'd'])

    await page.getByRole('button', { name: 'Save' }).click()

    await checkAlert(page, 'Updating accommodation', false)
    await checkAlert(page, 'Accommodation updated')

    const items = page.getByTestId('offer-accommodation-item')
    await expect(items).toHaveCount(3)
    await expect(items.filter({ hasText: 'accommodation 1' })).toBeVisible()
    await expect(items.filter({ hasText: 'accommodation 2' })).not.toBeVisible()
    await expect(
      items.filter({ hasText: 'changed second accommodation' }),
    ).toBeVisible()
    await expect(items.filter({ hasText: 'accommodation 3' })).toBeVisible()
  })

  test('should be able to delete accommodation', async ({ page }) => {
    const dialogPromise = page.waitForEvent('dialog').then(async dialog => {
      expect(dialog.type()).toBe('confirm')
      expect(dialog.message()).toContain(
        'Do you really want to delete the accommodation?',
      )
      await dialog.accept()
    })

    await page
      .getByTestId('offer-accommodation-item')
      .filter({ hasText: 'accommodation 2' })
      .getByRole('button', { name: 'Delete' })
      .click()

    await dialogPromise

    await checkAlert(page, 'Deleting accommodation', false)
    await checkAlert(page, 'Accommodation deleted')

    const items = page.getByTestId('offer-accommodation-item')
    await expect(items).toHaveCount(2)
    await expect(items.filter({ hasText: 'accommodation 1' })).toBeVisible()
    await expect(items.filter({ hasText: 'accommodation 2' })).not.toBeVisible()
    await expect(items.filter({ hasText: 'accommodation 3' })).toBeVisible()
  })

  test.describe('geoindex is set up', () => {
    const geoindexService = 'https://geoindex.example.com/profile/card#bot'
    const geoindexInboxUrl = new URL('/inbox', geoindexService).toString()

    test.beforeEach(async ({ page }) => {
      await updateAppConfig(
        page,
        { geoindexService },
        { locator: page.getByRole('link', { name: 'travel' }) },
      )
      // Wait for app to update - check for travel link as indicator
      await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()
      await goToOffers(page)
    })

    test("should send info about creation into geoindex's inbox", async ({
      page,
    }) => {
      // Intercept geoindex inbox POST requests
      await page.route(geoindexInboxUrl, async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201 })
        } else {
          await route.fallback()
        }
      })

      const geoindexRequestPromise = page.waitForRequest(
        request =>
          request.method() === 'POST' && request.url() === geoindexInboxUrl,
      )

      await expect(page.getByTestId('offer-accommodation-item')).toHaveCount(3)
      await page.getByRole('button', { name: 'Add Accommodation' }).click()

      await moveFormMap(page, ['l', 'u', 'i', 'l', 'l'])

      await page
        .locator("textarea[name='description.en']")
        .fill('This is a new description in English')
      await page.getByRole('button', { name: 'Save' }).click()

      await Promise.all([
        checkAlert(page, 'Creating accommodation', false).then(() =>
          checkAlert(page, 'Accommodation created'),
        ),
        checkAlert(page, 'Notifying indexing service', false).then(() =>
          checkAlert(page, 'Accommodation added to indexing service'),
        ),
      ])

      const geoindexRequest = await geoindexRequestPromise
      expect(geoindexRequest.postDataJSON()).toMatchObject({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Create',
        actor: { type: 'Person', id: person.account.webId },
        object: { type: 'Document' },
      })
    })

    test("should send info about update into geoindex's inbox", async ({
      page,
    }) => {
      await page.route(geoindexInboxUrl, async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 200 })
        } else {
          await route.fallback()
        }
      })

      const geoindexRequestPromise = page.waitForRequest(
        request =>
          request.method() === 'POST' && request.url() === geoindexInboxUrl,
      )

      await page
        .getByTestId('offer-accommodation-item')
        .filter({ hasText: 'accommodation 2' })
        .getByRole('button', { name: 'Edit' })
        .click()

      const descriptionTextarea = page.locator(
        "textarea[name='description.en']",
      )
      await descriptionTextarea.clear()
      await descriptionTextarea.fill('changed second accommodation')

      await moveFormMap(page, ['o', 'o', 'l', 'd'])

      await page.getByRole('button', { name: 'Save' }).click()

      await Promise.all([
        checkAlert(page, 'Updating accommodation', false).then(() =>
          checkAlert(page, /Accommodation updated$/),
        ),
        checkAlert(page, 'Notifying indexing service', false).then(() =>
          checkAlert(page, 'Accommodation updated in indexing service'),
        ),
      ])

      const geoindexRequest = await geoindexRequestPromise
      expect(geoindexRequest.postDataJSON()).toMatchObject({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Update',
        actor: { type: 'Person', id: person.account.webId },
        object: { type: 'Document' },
      })
    })

    test("should send info about deletion into geoindex's inbox", async ({
      page,
    }) => {
      page.once('dialog', dialog => dialog.accept())

      await page.route(geoindexInboxUrl, async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 204 })
        } else {
          await route.fallback()
        }
      })

      const geoindexRequestPromise = page.waitForRequest(
        request =>
          request.method() === 'POST' && request.url() === geoindexInboxUrl,
      )

      await page
        .getByTestId('offer-accommodation-item')
        .filter({ hasText: 'accommodation 2' })
        .getByRole('button', { name: 'Delete' })
        .click()

      await Promise.all([
        checkAlert(page, 'Deleting accommodation', false).then(() =>
          checkAlert(page, 'Accommodation deleted'),
        ),
        checkAlert(page, 'Notifying indexing service', false).then(() =>
          checkAlert(page, 'Accommodation removed from indexing service'),
        ),
      ])

      const geoindexRequest = await geoindexRequestPromise
      expect(geoindexRequest.postDataJSON()).toMatchObject({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Delete',
        actor: { type: 'Person', id: person.account.webId },
        object: { type: 'Document' },
      })
    })
  })
})
