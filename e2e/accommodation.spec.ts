import { Page, test } from '@playwright/test'

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
  // TODO: Implement
  // - Wait for map container to be visible: [data-cy="accommodation-form"] .accommodation-map-container-edit .leaflet-control-container
  // - Focus the map container
  // - For each move, press the corresponding key with small delay between
}

// Helper: navigate to offers page
const goToOffers = async (page: Page) => {
  // TODO: Implement
  // - Click link containing 'host'
  // - Verify pathname equals '/host/offers'
}

test.describe('accommodations offered by person', () => {
  // TODO: beforeEach needs to:
  // 1. Create person (cy.createPerson)
  // 2. Add 3 accommodations with:
  //    - { description: { en: 'accommodation 1' }, location: [50, 16] }
  //    - { description: { en: 'accommodation 2' }, location: [51, 17] }
  //    - { description: { en: 'accommodation 3' }, location: [52, 18] }
  // 3. Sign in as person
  // 4. Go to offers page

  test.fixme('should be able to navigate to my offers page from user menu', async ({
    page,
  }) => {
    // - Visit '/'
    // - Click [data-cy="menu-button"]
    // - Click link 'my hosting'
    // - Verify pathname equals '/host/offers'
  })

  test.fixme('should be able to see accommodations of other person', async ({
    page,
  }) => {
    // Original test was empty/TODO with comment: "not sure about this"
  })

  test.fixme('should be able to see accommodations offered by me', async ({
    page,
  }) => {
    // - Verify [data-cy="offer-accommodation-item"] has length 3
    // - Verify contains text 'accommodation 1', 'accommodation 2', 'accommodation 3'
  })

  test.fixme('should be able to add a new accommodation', async ({ page }) => {
    // - Verify [data-cy="offer-accommodation-item"] has length 3
    // - Click button 'Add Accommodation'
    // - moveFormMap(['l', 'u', 'i', 'l', 'l'])
    // - Type 'This is a new description in English' into textarea[name='description.en']
    // - Click button 'Save'
    // - Verify toast 'Creating accommodation'
    // - Verify and close toast 'Accommodation created'
    // - Verify [data-cy="offer-accommodation-item"] has length 4
    // - Verify contains text 'This is a new description in English'
  })

  test.fixme("should encounter validation error when location hasn't been moved", async ({
    page,
  }) => {
    // - Verify [data-cy="offer-accommodation-item"] has length 3
    // - Click button 'Add Accommodation'
    // - moveFormMap([]) - don't move
    // - Type 'This is a new description in English' into textarea[name='description.en']
    // - Click button 'Save'
    // - Verify text 'Please move map to your hosting location' is visible
  })

  test.fixme('should encounter validation error when description is empty', async ({
    page,
  }) => {
    // - Verify [data-cy="offer-accommodation-item"] has length 3
    // - Click button 'Add Accommodation'
    // - moveFormMap(['l', 'u', 'i'])
    // - Click button 'Save'
    // - Verify text 'This field is required' is visible
  })

  test.fixme('should be able to edit location and description of accommodation', async ({
    page,
  }) => {
    // - Find [data-cy="offer-accommodation-item"] containing 'accommodation 2'
    // - Click its 'Edit' button
    // - Clear and type 'changed second accommodation' into textarea[name='description.en']
    // - moveFormMap(['o', 'o', 'l', 'd'])
    // - Click button 'Save'
    // - Verify toast 'Updating accommodation'
    // - Verify and close toast 'Accommodation updated'
    // - Verify [data-cy="offer-accommodation-item"] has length 3
    // - Verify contains 'accommodation 1', 'changed second accommodation', 'accommodation 3'
    // - Verify does NOT contain 'accommodation 2'
  })

  test.fixme('should be able to delete accommodation', async ({ page }) => {
    // - Find [data-cy="offer-accommodation-item"] containing 'accommodation 2'
    // - Click its 'Delete' button
    // - Verify toast 'Deleting accommodation'
    // - Verify and close toast 'Accommodation deleted'
    // - Verify [data-cy="offer-accommodation-item"] has length 2
    // - Verify contains 'accommodation 1', 'accommodation 3'
    // - Verify does NOT contain 'accommodation 2'
  })

  test.describe('geoindex is set up', () => {
    const geoindexService = 'https://geoindex.example.com/profile/card#bot'

    // TODO: beforeEach needs to:
    // 1. updateAppConfig({ geoindexService }, { waitForContent: 'travel' })
    // 2. goToOffers()

    test.fixme("should send info about creation into geoindex's inbox", async ({
      page,
    }) => {
      // - Intercept POST to geoindexService/inbox, return 201
      // - Verify [data-cy="offer-accommodation-item"] has length 3
      // - Click button 'Add Accommodation'
      // - moveFormMap(['l', 'u', 'i', 'l', 'l'])
      // - Type 'This is a new description in English' into textarea[name='description.en']
      // - Click button 'Save'
      // - Verify toast 'Creating accommodation'
      // - Verify toast 'Notifying indexing service'
      // - Verify and close toast 'Accommodation created'
      // - Verify and close toast 'Accommodation added to indexing service'
      // - Wait for intercepted request
      // - Verify request body contains:
      //   {
      //     '@context': 'https://www.w3.org/ns/activitystreams',
      //     type: 'Create',
      //     actor: { type: 'Person', id: me.webId },
      //     object: { type: 'Document' },
      //   }
    })

    test.fixme("should send info about update into geoindex's inbox", async ({
      page,
    }) => {
      // - Intercept POST to geoindexService/inbox, return 200
      // - Find [data-cy="offer-accommodation-item"] containing 'accommodation 2'
      // - Click its 'Edit' button
      // - Clear and type 'changed second accommodation' into textarea[name='description.en']
      // - moveFormMap(['o', 'o', 'l', 'd'])
      // - Click button 'Save'
      // - Verify toast 'Updating accommodation'
      // - Verify toast 'Notifying indexing service'
      // - Verify and close toast 'Accommodation updated'
      // - Verify and close toast 'Accommodation updated in indexing service'
      // - Wait for intercepted request
      // - Verify request body contains:
      //   {
      //     '@context': 'https://www.w3.org/ns/activitystreams',
      //     type: 'Update',
      //     actor: { type: 'Person', id: me.webId },
      //     object: { type: 'Document' },
      //   }
    })

    test.fixme("should send info about deletion into geoindex's inbox", async ({
      page,
    }) => {
      // - Intercept POST to geoindexService/inbox, return 204
      // - Find [data-cy="offer-accommodation-item"] containing 'accommodation 2'
      // - Click its 'Delete' button
      // - Verify toast 'Deleting accommodation'
      // - Verify toast 'Notifying indexing service'
      // - Verify and close toast 'Accommodation deleted'
      // - Verify and close toast 'Accommodation removed from indexing service'
      // - Wait for intercepted request
      // - Verify request body contains:
      //   {
      //     '@context': 'https://www.w3.org/ns/activitystreams',
      //     type: 'Delete',
      //     actor: { type: 'Person', id: me.webId },
      //     object: { type: 'Document' },
      //   }
    })
  })
})
