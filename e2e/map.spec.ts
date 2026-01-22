import { expect, Page, test } from '@playwright/test'
import ngeohash from 'ngeohash'
import encodeURIComponent from 'strict-uri-encode'
import { AccommodationConfig, addAccommodation } from './helpers/accommodation'
import { createPerson, signIn, type Person } from './helpers/account'
import { setupCommunity, type Community } from './helpers/community'
import { updateAppConfig } from './helpers/helpers'
import { stubDirectMailer } from './helpers/mailer'

const users = Array(10)
  .fill(null)
  .map((_, i) => (i === 0 ? 'me' : `user${i}`))

type PersonAccommodation = {
  person: Person
  accommodation: AccommodationConfig
  geohash: string
}

// Helper: navigate to travel search page
const goToTravelSearch = async (page: Page) => {
  await page.getByRole('link', { name: 'travel' }).click()
  await expect(page).toHaveURL('/travel/search')
}

// Helper: check that offers are shown on map
const testOffers = async (page: Page) => {
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(10)
}

// Helper: test clicking an offer
const testClickOffer = async (
  page: Page,
  user2: Person,
  user2Accommodation: AccommodationConfig,
) => {
  // TODO test person's photo
  // await page.locator('.leaflet-marker-icon[alt="Accommodation offer from Name 2"]')
  //   .first()
  //   .click()

  const geohash = ngeohash.encode(...user2Accommodation.location, 10)
  await page.locator(`.leaflet-marker-icon.geohash-${geohash}`).click()

  await expect(page).toHaveURL(
    `/travel/search?hosting=${encodeURIComponent(user2Accommodation.id)}`,
  )

  await expect(page.getByTestId('accommodation-info-name')).toContainText(
    'Name 2',
  )
  await expect(
    page.getByTestId('accommodation-info-description'),
  ).toContainText('accommodation of user2')

  await expect(
    page.getByRole('link', { name: 'Write a message' }),
  ).toHaveAttribute(
    'href',
    `/messages?with=${encodeURIComponent(user2.account.webId)}`,
  )
}

/**
 * Given a geohash and an array of accommodations, return turtle that only
 * contains those located within the geohash, just like the geoindex service
 * would respond
 */
const getGeohashQueryResponse = (
  geohash: string,
  accommodations: PersonAccommodation[],
) => {
  const relevantAccommodations = accommodations.filter(a =>
    a.geohash.startsWith(geohash),
  )

  const body = relevantAccommodations
    .map(
      a =>
        `<${a.accommodation.id}> <https://example.com/ns#geohash> "${geohash}", "${a.geohash}".`,
    )
    .join('\n')

  return body
}

test.describe('Map of accommodation offers', () => {
  let community: Community
  let accommodations: PersonAccommodation[]
  let me: Person
  let user2: Person
  let user2Accommodation: AccommodationConfig

  test.beforeEach(async ({ page }) => {
    community = await setupCommunity(page)
    accommodations = []

    // Create people and their accommodations
    for (let i = 0; i < users.length; i++) {
      const tag = users[i]
      const person = await createPerson({
        community,
        profile: {
          name: `Name ${i}`,
          description: { en: `This is English description ${i}` },
        },
      })

      const location: [number, number] =
        i % 2 === 1 ? [5 * i + 5, 10 * i - 10] : [-10 * i + 40, 5 * i - 90]

      const accommodation = await addAccommodation(person, {
        description: { en: `accommodation of ${tag}` },
        location,
      })

      accommodations.push({
        person,
        accommodation,
        geohash: ngeohash.encode(...location, 10),
      })

      if (tag === 'me') me = person
      if (tag === 'user2') {
        user2 = person
        user2Accommodation = accommodation
      }
    }

    // Stub mailer and sign in
    await stubDirectMailer(page, { person: me })
    await signIn(page, me.account)
  })

  test('should show offers of community folks', async ({ page }) => {
    // Go to map
    await goToTravelSearch(page)
    await testOffers(page)
  })

  test("[on click offer] should show detail with person's photo, name, offer description, link to write message", async ({
    page,
  }) => {
    // Go to map
    await goToTravelSearch(page)
    await testClickOffer(page, user2, user2Accommodation)
  })

  test.describe('geoindex is set up', () => {
    const geoindexService = 'https://geoindex.example.com/profile/card#bot'
    const geoindexQueryUrl = new URL('/query', geoindexService).toString()
    const queries = '0123456789bcdefghjkmnpqrstuvwxyz'
      .split('')
      .map(c => `"${c}"`)

    test.beforeEach(async ({ page }) => {
      await updateAppConfig(
        page,
        { geoindexService },
        { locator: page.getByRole('link', { name: 'travel' }) },
      )
    })

    test('should fetch offers in the displayed area using geoindex', async ({
      page,
    }) => {
      await page.route(`${geoindexQueryUrl}**`, async route => {
        const url = new URL(route.request().url())
        const objectParam = url.searchParams.get('object')
        if (objectParam) {
          const geohash = objectParam.replaceAll('"', '')
          await route.fulfill({
            status: 200,
            body: getGeohashQueryResponse(geohash, accommodations),
          })
        } else {
          await route.fallback()
        }
      })

      const geoindexRequestPromise = page.waitForRequest(request => {
        if (!request.url().startsWith(geoindexQueryUrl)) return false
        const url = new URL(request.url())
        const objectParam = url.searchParams.get('object')
        return objectParam !== null && queries.includes(objectParam)
      })

      await goToTravelSearch(page)
      await geoindexRequestPromise

      await testOffers(page)
      await testClickOffer(page, user2, user2Accommodation)
    })

    test('when the geoindex fails, it should fall back to the slow querying', async ({
      page,
    }) => {
      await page.route(`${geoindexQueryUrl}**`, async route => {
        await route.abort('failed')
      })

      const geoindexRequestPromise = page.waitForRequest(request => {
        if (!request.url().startsWith(geoindexQueryUrl)) return false
        const url = new URL(request.url())
        const objectParam = url.searchParams.get('object')
        return objectParam !== null && queries.includes(objectParam)
      })

      await goToTravelSearch(page)
      await geoindexRequestPromise

      await testOffers(page)
      await testClickOffer(page, user2, user2Accommodation)
    })
  })
})
