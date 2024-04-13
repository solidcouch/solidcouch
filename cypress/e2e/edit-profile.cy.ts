import { Person } from '../support/commands'

const profile = {
  name: 'Test Name',
  description: {
    // we wanted to test multiline description, but cypress wasn't detecting it
    en: 'Hello! This is description in English.',
  },
}

describe('edit profile', () => {
  // create person
  beforeEach(() => {
    cy.createPerson(profile).as('me')
  })

  // sign in
  beforeEach(() => {
    cy.get<Person>('@me').then(person => {
      cy.stubMailer({ person })
      cy.login(person)
    })
  })

  it('should be able to navigate to profile edit page from profile page', () => {
    // through header, open profile page
    cy.get('[class^=Header_header] .szh-menu-button').click()
    cy.get('a[href="/profile"]').click()
    cy.get('[class^=Profile_container]').contains('a', 'edit profile').click()
    cy.location().its('pathname').should('equal', '/profile/edit')
  })

  it('should be able to navigate to profile edit page from user menu', () => {
    // through header, open edit-profile page
    cy.get('[class^=Header_header] .szh-menu-button').click()
    cy.get('[class^=Header_header] .szh-menu')
      .contains('a', 'edit profile')
      .click()
    cy.location().its('pathname').should('equal', '/profile/edit')
  })

  it('should be able to edit name, photo and description', () => {
    cy.get<Person>('@me').then(me => {
      cy.visit('/profile/edit')
      cy.get('input[name=name]')
        .should('have.value', profile.name)
        .clear()
        .type('Mynew Name')
      cy.get('textarea[name=about]')
        .should('have.value', profile.description.en)
        .clear()
        .type('this is my new description{enter}{enter}and it is multiline')
      cy.get('input[name=photo]').parent().selectFile('cypress/e2e/image.png')

      // intercept that the photo was saved
      cy.intercept({ method: 'POST', url: me.hospexContainer }).as('savePhoto')
      cy.contains('button', 'Save changes').click()

      cy.wait('@savePhoto').then(interception => {
        cy.intercept({
          method: 'GET',
          // intercept that we fetch the newly created image later
          url: interception.response.headers.location as string,
        }).as('fetchSavedPhoto')
      })

      cy.location()
        .its('pathname')
        .should('equal', `/profile/${encodeURIComponent(me.webId)}`)

      // it's kind of hard to test uri of protected photo
      // so we can at least test that we fetched the saved photo
      cy.wait('@fetchSavedPhoto')
      cy.contains('[class^=Profile_name]', 'Mynew Name')
      cy.contains('[class^=Profile_about]', 'this is my new description')
    })
  })

  it('should be able to add and remove interest', () => {
    cy.visit('/profile/edit')
    // add interest
    cy.intercept(
      {
        method: 'GET',
        url: 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=wild%20boar&language=en&limit=20&continue=0&format=json&uselang=en&type=item&origin=*',
      },
      { fixture: 'wikidata-search-wild-boar' },
    )
    cy.intercept(
      {
        method: 'GET',
        url: 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=badger&language=en&limit=20&continue=0&format=json&uselang=en&type=item&origin=*',
      },
      { fixture: 'wikidata-search-badger' },
    )
    cy.intercept(
      'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q27066&languages=en&format=json&origin=*',
      { fixture: 'wikidata-badger' },
    )
    cy.intercept(
      'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q58697&languages=en&format=json&origin=*',
      { fixture: 'wikidata-sus-scrofa' },
    )

    // no interests should be there, yet
    cy.get('ul[class^=Interests_list]')
      .should('not.contain.text', 'Sus scrofa')
      .and('not.contain.text', 'European badger')

    // add one interest
    cy.get('input#react-select-3-input').type('wild boar')
    cy.contains('omnivore').click()
    cy.get('ul[class^=Interests_list]').should('contain.text', 'Sus scrofa')

    // add another interest
    cy.get('input#react-select-3-input').type('badger')
    cy.contains('species of carnivorans').click()
    cy.get('ul[class^=Interests_list]')
      .should('contain.text', 'European badger')
      .and('contain.text', 'Sus scrofa')

    // check that profile contains the new interests
    cy.visit('/profile')
    cy.get('ul[class^=Interests_list]')
      .should('contain.text', 'European badger')
      .and('contain.text', 'Sus scrofa')

    // go back to editing the profile and remove one of the interests
    cy.visit('/profile/edit')
    cy.get('ul[class^=Interests_list]')
      .should('contain.text', 'European badger')
      .and('contain.text', 'Sus scrofa')

    // find one interest and click its remove button
    cy.contains('[class^=Interests_item]', 'Sus scrofa').find('button').click()

    // was it removed?
    cy.get('ul[class^=Interests_list]')
      .should('contain.text', 'European badger')
      .and('not.contain.text', 'Sus scrofa')
    // was it removed from profile, too?
    cy.visit('/profile')
    cy.get('ul[class^=Interests_list]')
      .should('contain.text', 'European badger')
      .and('not.contain.text', 'Sus scrofa')
  })
})
