import { UserConfig } from '../support/css-authentication'
import { CommunityConfig } from '../support/setup'

const profile = {
  name: 'Test Name',
  description: {
    // we wanted to test multiline description, but cypress wasn't detecting it
    en: 'Hello! This is description in English.',
  },
}

describe('accommodations offered by person', () => {
  // create and setup community and profiles
  beforeEach(() => {
    cy.setupCommunity({ community: Cypress.env('COMMUNITY') }).as('community')
    cy.createRandomAccount().as('me')
    cy.get<CommunityConfig>('@community').then(community => {
      cy.get<UserConfig>('@me').then(user => {
        cy.setupPod(user, community)
          .as('setupMe')
          .then(setup => {
            cy.setProfileData(user, setup, profile)
            cy.addAccommodation(user, setup, {
              description: { en: 'accommodation 1' },
              location: [50, 16],
            })
            cy.addAccommodation(user, setup, {
              description: { en: 'accommodation 2' },
              location: [51, 17],
            })
            cy.addAccommodation(user, setup, {
              description: { en: 'accommodation 3' },
              location: [52, 18],
            })
          })
      })
    })
  })

  // sign in
  beforeEach(() => {
    cy.get<UserConfig>('@me').then(user => {
      cy.login(user)
    })
  })

  // go to offers page
  beforeEach(() => {
    cy.contains('a', 'host').click()
    cy.location().its('pathname').should('equal', '/host/offers')
  })

  it('[other person] should be able to see accommodations of person') // not sure about this

  it('[me] should be able to see accommodations offered by me', () => {
    cy.get('li[class^=MyOffers_accommodation]')
      .should('have.length', 3)
      .and('contain.text', 'accommodation 1')
      .and('contain.text', 'accommodation 2')
      .and('contain.text', 'accommodation 3')
  })

  it('[me] should be able to add new accommodation', () => {
    cy.get('li[class^=MyOffers_accommodation]').should('have.length', 3)
    cy.contains('button', 'Add Accommodation').click()

    // TODO drag the map

    // write some description
    cy.get('textarea[name=description]').type(
      'This is a new description in English',
    )
    cy.contains('button', 'Submit').click()
    cy.get('li[class^=MyOffers_accommodation]')
      .should('have.length', 4)
      .and('contain.text', 'This is a new description in English')
  })

  it('[me] should be able to edit location and description of accommodation', () => {
    cy.contains('li[class^=MyOffers_accommodation]', 'accommodation 2')
      .contains('button', 'Edit')
      .click()
    cy.get('textarea[name="description"]')
      .clear()
      .type('changed second accommodation')
    //TODO change location, too
    cy.contains('button', 'Submit').click()
    cy.get('li[class^=MyOffers_accommodation]')
      .should('have.length', 3)
      .and('contain.text', 'accommodation 1')
      .and('not.contain.text', 'accommodation 2')
      .and('contain.text', 'changed second accommodation')
      .and('contain.text', 'accommodation 3')
  })

  it('[me] should be able to delete accommodation', () => {
    cy.contains('li[class^=MyOffers_accommodation]', 'accommodation 2')
      .contains('button', 'Delete')
      .click()
    cy.get('li[class^=MyOffers_accommodation]')
      .should('have.length', 2)
      .and('contain.text', 'accommodation 1')
      .and('not.contain.text', 'accommodation 2')
      .and('contain.text', 'accommodation 3')
  })
})
