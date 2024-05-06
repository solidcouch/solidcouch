import { Person } from '../support/commands'

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

  // go to offers page
  beforeEach(() => {
    cy.contains('a', 'host').click()
    cy.location().its('pathname').should('equal', '/host/offers')
  })

  it('should be able to navigate to my offers page from user menu', () => {
    // through header, open edit-profile page
    cy.visit('/')
    cy.get('[class^=Header_header] .szh-menu-button').click()
    cy.contains('a', 'my hosting').click()
    cy.location().its('pathname').should('equal', '/host/offers')
  })

  it('should be able to see accommodations of other person') // not sure about this

  it('should be able to see accommodations offered by me', () => {
    cy.get('li[class^=MyOffers_accommodation]')
      .should('have.length', 3)
      .and('contain.text', 'accommodation 1')
      .and('contain.text', 'accommodation 2')
      .and('contain.text', 'accommodation 3')
  })

  it('should be able to add a new accommodation', () => {
    cy.get('li[class^=MyOffers_accommodation]').should('have.length', 3)
    cy.contains('button', 'Add Accommodation').click()

    // move the map
    cy.get('[class^=AccommodationView_mapContainer]')
      .last()
      .focus()
      .type('{leftarrow}{uparrow}+')

    // write some description
    cy.get('textarea[name=description]').type(
      'This is a new description in English',
    )
    cy.contains('button', 'Submit').click()
    cy.get('li[class^=MyOffers_accommodation]')
      .should('have.length', 4)
      .and('contain.text', 'This is a new description in English')
  })

  it("should encounter validation error when location hasn't been moved", () => {
    cy.get('li[class^=MyOffers_accommodation]').should('have.length', 3)
    cy.contains('button', 'Add Accommodation').click()

    // don't move the map

    // write some description
    cy.get('textarea[name=description]').type(
      'This is a new description in English',
    )
    cy.contains('button', 'Submit').click()
    cy.contains('Please move map to your hosting location')
  })

  it('should encounter validation error when description is empty', () => {
    cy.get('li[class^=MyOffers_accommodation]').should('have.length', 3)
    cy.contains('button', 'Add Accommodation').click()

    // move the map
    cy.get('[class^=AccommodationView_mapContainer]')
      .last()
      .focus()
      .type('{leftarrow}{uparrow}+')

    cy.contains('button', 'Submit').click()
    cy.contains('This field is required')
  })

  it('should be able to edit location and description of accommodation', () => {
    cy.contains('li[class^=MyOffers_accommodation]', 'accommodation 2')
      .contains('button', 'Edit')
      .click()
    cy.get('textarea[name="description"]')
      .clear()
      .type('changed second accommodation')
    cy.get('[class^=AccommodationView_mapContainer]')
      .last()
      .focus()
      .type('{leftarrow}{downarrow}')
    cy.contains('button', 'Submit').click()
    cy.get('li[class^=MyOffers_accommodation]')
      .should('have.length', 3)
      .and('contain.text', 'accommodation 1')
      .and('not.contain.text', 'accommodation 2')
      .and('contain.text', 'changed second accommodation')
      .and('contain.text', 'accommodation 3')
  })

  it('should be able to delete accommodation', () => {
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
