import { Person } from '../support/commands.js'

// left, right, up, down, zoom in, zoom out
type Move = 'l' | 'r' | 'u' | 'd' | 'i' | 'o'

const moveDict: Record<Move, string> = {
  l: '{leftarrow}',
  r: '{rightarrow}',
  u: '{uparrow}',
  d: '{downarrow}',
  i: '+',
  o: '-',
}

const moveFormMap = (moves: Move[]) => {
  // form should open and map should load
  cy.get(
    '[data-cy="accommodation-form"] [data-cy="accommodation-map-container"] .leaflet-control-container',
  ).should('have.length', 1)

  // wait a bit to make really sure map has loaded
  cy.wait(1000)

  // move the map
  const m = cy
    .get(
      '[data-cy="accommodation-form"] [data-cy="accommodation-map-container"]',
    )
    .should('have.length', 1)
    .last()
    .focus()

  for (const move of moves) {
    cy.wait(500)
    m.type(moveDict[move])
  }
}

describe('accommodations offered by person', () => {
  // create and setup community and profiles
  beforeEach(() => {
    cy.createPerson().as('me')
    cy.get<Person>('@me').then(person => {
      cy.addAccommodation(person, {
        description: { en: 'accommodation 1' },
        location: [50, 16],
      })
      cy.addAccommodation(person, {
        description: { en: 'accommodation 2' },
        location: [51, 17],
      })
      cy.addAccommodation(person, {
        description: { en: 'accommodation 3' },
        location: [52, 18],
      })
    })
  })

  // sign in
  beforeEach(() => {
    cy.get<Person>('@me').then(person => {
      cy.stubMailer({ person })
      cy.login(person)
    })
  })

  /**
   * Go to offers page
   */
  const goToOffers = () => {
    cy.contains('a', 'host').click()
    cy.location().its('pathname').should('equal', '/host/offers')
  }

  // go to offers page
  beforeEach(goToOffers)

  it('should be able to navigate to my offers page from user menu', () => {
    // through header, open edit-profile page
    cy.visit('/')
    cy.get('[data-cy="menu-button"]').click()
    cy.contains('a', 'my hosting').click()
    cy.location().its('pathname').should('equal', '/host/offers')
  })

  it('should be able to see accommodations of other person') // not sure about this

  it('should be able to see accommodations offered by me', () => {
    cy.get('[data-cy="offer-accommodation-item"]')
      .should('have.length', 3)
      .and('contain.text', 'accommodation 1')
      .and('contain.text', 'accommodation 2')
      .and('contain.text', 'accommodation 3')
  })

  it('should be able to add a new accommodation', () => {
    cy.get('[data-cy="offer-accommodation-item"]').should('have.length', 3)
    cy.contains('button', 'Add Accommodation').click()

    // move the map
    moveFormMap(['l', 'u', 'i', 'l', 'l'])

    // write some description
    cy.get('textarea[name=description]').type(
      'This is a new description in English',
    )
    cy.contains('button', 'Submit').click()

    cy.testToast('Creating accommodation')
    cy.testAndCloseToast('Accommodation created')

    cy.get('[data-cy="offer-accommodation-item"]')
      .should('have.length', 4)
      .and('contain.text', 'This is a new description in English')
  })

  it("should encounter validation error when location hasn't been moved", () => {
    cy.get('[data-cy="offer-accommodation-item"]').should('have.length', 3)
    cy.contains('button', 'Add Accommodation').click()

    // don't move the map
    moveFormMap([])

    // write some description
    cy.get('textarea[name=description]').type(
      'This is a new description in English',
    )
    cy.contains('button', 'Submit').click()
    cy.contains('Please move map to your hosting location')
  })

  it('should encounter validation error when description is empty', () => {
    cy.get('[data-cy="offer-accommodation-item"]').should('have.length', 3)
    cy.contains('button', 'Add Accommodation').click()

    moveFormMap(['l', 'u', 'i'])

    cy.contains('button', 'Submit').click()
    cy.contains('This field is required')
  })

  it('should be able to edit location and description of accommodation', () => {
    cy.contains('[data-cy="offer-accommodation-item"]', 'accommodation 2')
      .contains('button', 'Edit')
      .click()
    cy.get('textarea[name="description"]')
      .clear()
      .type('changed second accommodation')

    moveFormMap(['o', 'o', 'l', 'd'])

    cy.contains('button', 'Submit').click()
    cy.testToast('Updating accommodation')
    cy.testAndCloseToast('Accommodation updated')
    cy.get('[data-cy="offer-accommodation-item"]')
      .should('have.length', 3)
      .and('contain.text', 'accommodation 1')
      .and('not.contain.text', 'accommodation 2')
      .and('contain.text', 'changed second accommodation')
      .and('contain.text', 'accommodation 3')
  })

  it('should be able to delete accommodation', () => {
    cy.contains('[data-cy="offer-accommodation-item"]', 'accommodation 2')
      .contains('button', 'Delete')
      .click()
    cy.testToast('Deleting accommodation')
    cy.testAndCloseToast('Accommodation deleted')
    cy.get('[data-cy="offer-accommodation-item"]')
      .should('have.length', 2)
      .and('contain.text', 'accommodation 1')
      .and('not.contain.text', 'accommodation 2')
      .and('contain.text', 'accommodation 3')
  })

  context('geoindex is set up', () => {
    const geoindexService = 'https://geoindex.example.com/profile/card#bot'
    beforeEach(() => {
      cy.updateAppConfig({ geoindexService }, { waitForContent: 'travel' })
      goToOffers()
    })

    it("should send info about creation into geoindex's inbox", () => {
      cy.get<Person>('@me').then(me => {
        // test creation
        cy.intercept('POST', new URL('/inbox', geoindexService).toString(), {
          statusCode: 201,
        }).as('geoindexInbox')
        cy.get('[data-cy="offer-accommodation-item"]').should('have.length', 3)
        cy.contains('button', 'Add Accommodation').click()

        // move the map
        moveFormMap(['l', 'u', 'i', 'l', 'l'])

        // write some description
        cy.get('textarea[name=description]').type(
          'This is a new description in English',
        )
        cy.contains('button', 'Submit').click()

        cy.testToast('Creating accommodation')
        cy.testToast('Notifying indexing service')
        cy.testAndCloseToast('Accommodation created')
        cy.testAndCloseToast('Accommodation added to indexing service')

        cy.wait('@geoindexInbox')
          .its('request.body')
          .should('containSubset', {
            '@context': 'https://www.w3.org/ns/activitystreams',
            type: 'Create',
            actor: { type: 'Person', id: me.webId },
            object: { type: 'Document' },
          })
      })
    })

    it("should send info about update into geoindex's inbox", () => {
      cy.get<Person>('@me').then(me => {
        // test update
        cy.intercept('POST', new URL('/inbox', geoindexService).toString(), {
          statusCode: 200,
        }).as('geoindexInbox')

        cy.contains('[data-cy="offer-accommodation-item"]', 'accommodation 2')
          .contains('button', 'Edit')
          .click()
        cy.get('textarea[name="description"]')
          .clear()
          .type('changed second accommodation')

        moveFormMap(['o', 'o', 'l', 'd'])

        cy.contains('button', 'Submit').click()
        cy.testToast('Updating accommodation')
        cy.testToast('Notifying indexing service')
        cy.testAndCloseToast('Accommodation updated')
        cy.testAndCloseToast('Accommodation updated in indexing service')

        cy.wait('@geoindexInbox')
          .its('request.body')
          .should('containSubset', {
            '@context': 'https://www.w3.org/ns/activitystreams',
            type: 'Update',
            actor: { type: 'Person', id: me.webId },
            object: { type: 'Document' },
          })
      })
    })

    it("should send info about deletion into geoindex's inbox", () => {
      cy.get<Person>('@me').then(me => {
        // test deletion
        cy.intercept('POST', new URL('/inbox', geoindexService).toString(), {
          statusCode: 204,
        }).as('geoindexInbox')

        cy.contains('[data-cy="offer-accommodation-item"]', 'accommodation 2')
          .contains('button', 'Delete')
          .click()
        cy.testToast('Deleting accommodation')
        cy.testToast('Notifying indexing service')
        cy.testAndCloseToast('Accommodation deleted')
        cy.testAndCloseToast('Accommodation removed from indexing service')

        cy.wait('@geoindexInbox')
          .its('request.body')
          .should('containSubset', {
            '@context': 'https://www.w3.org/ns/activitystreams',
            type: 'Delete',
            actor: { type: 'Person', id: me.webId },
            object: { type: 'Document' },
          })
      })
    })
  })
})
