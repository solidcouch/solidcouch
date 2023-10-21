import { range } from 'lodash'
import { Person } from '../support/commands'
import { UserConfig } from '../support/css-authentication'
import { AccommodationConfig } from '../support/setup'

const users = range(10).map(i => (i === 0 ? 'me' : `user${i}`))

describe('Map of accommodation offers', () => {
  // create people and their accommodations
  beforeEach(() => {
    users.forEach((tag, i) => {
      cy.createPerson({
        name: `Name ${i}`,
        description: { en: `This is English description ${i}` },
      }).as(tag)
      cy.get<Person>(`@${tag}`).then(person => {
        cy.addAccommodation(person, {
          description: { en: `accommodation of ${tag}` },
          location:
            i % 2 === 1 ? [5 * i + 5, 10 * i - 10] : [-10 * i + 40, 5 * i - 90],
        }).as(`${tag}Accommodation`)
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

  // go to map
  beforeEach(() => {
    cy.contains('a', 'travel').click()
    cy.location().its('pathname').should('equal', '/travel/search')
  })

  it('should show offers of community folks', () => {
    cy.get('.leaflet-marker-icon').should('have.length', 10)
  })

  it("[on click offer] should show detail with person's photo, name, offer description, link to write message", () => {
    // TODO test person's photo
    cy.get('.leaflet-marker-icon[alt="Accommodation offer from Name 2"]')
      .first()
      .click()

    cy.get<AccommodationConfig>('@user2Accommodation').then(accommodation => {
      cy.location()
        .its('search')
        .should('equal', `?hosting=${encodeURIComponent(accommodation.id)}`)
      cy.location().its('pathname').should('equal', '/travel/search')
    })
    cy.get('[class^=AccommodationInfo_name]').should('contain.text', 'Name 2')
    cy.get('[class^=AccommodationInfo_accommodation]').should(
      'contain.text',
      'accommodation of user2',
    )

    cy.get<UserConfig>('@user2').then(user => {
      cy.contains('a', 'Write a message').should(
        'have.attr',
        'href',
        `/messages/${encodeURIComponent(user.webId)}`,
      )
    })
  })

  it('should fetch offers in the displayed area only (requires indexing)')
})
