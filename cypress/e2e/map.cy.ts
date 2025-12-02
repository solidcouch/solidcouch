import range from 'lodash/range'
import ngeohash from 'ngeohash'
import encodeURIComponent from 'strict-uri-encode'
import { Person } from '../support/commands'
import { UserConfig } from '../support/css-authentication'
import { AccommodationConfig } from '../support/setup'

const users = range(10).map(i => (i === 0 ? 'me' : `user${i}`))

type PersonAccommodation = {
  person: Person
  accommodation: AccommodationConfig
  geohash: string
}

describe('Map of accommodation offers', () => {
  // create people and their accommodations
  beforeEach(() => {
    const accommodations: PersonAccommodation[] = []

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
        })
          .as(`${tag}Accommodation`)
          .then(accommodation => {
            accommodations.push({
              person,
              accommodation,
              geohash: ngeohash.encode(...accommodation.location, 10),
            })
          })
      })
    })

    cy.wrap(accommodations).as('accommodations')
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

  const testOffers = () => {
    cy.get('.leaflet-marker-icon').should('have.length', 10)
  }
  it('should show offers of community folks', testOffers)

  const testClickOffer = () => {
    // TODO test person's photo
    // cy.get('.leaflet-marker-icon[alt="Accommodation offer from Name 2"]')
    // .first()
    // .click()

    cy.get<AccommodationConfig>('@user2Accommodation').then(accommodation => {
      cy.get(
        `.leaflet-marker-icon.geohash-${ngeohash.encode(
          ...accommodation.location,
          10,
        )}`,
      ).click()
      cy.location()
        .its('search')
        .should('equal', `?hosting=${encodeURIComponent(accommodation.id)}`)
      cy.location().its('pathname').should('equal', '/travel/search')
    })
    cy.get('[data-cy=accommodation-info-name]').should('contain.text', 'Name 2')
    cy.get('[data-cy=accommodation-info-description]').should(
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
  }
  it(
    "[on click offer] should show detail with person's photo, name, offer description, link to write message",
    testClickOffer,
  )

  context('geoindex is set up', () => {
    const geoindexService = 'https://geoindex.example.com/profile/card#bot'
    beforeEach(() => {
      cy.updateAppConfig({ geoindexService }, { waitForContent: 'travel' })
    })

    it('should fetch offers in the displayed area using geoindex', () => {
      cy.get<PersonAccommodation[]>('@accommodations').then(accommodations => {
        cy.intercept(
          'GET',
          new URL('/query?object="*"', geoindexService).toString(),
          req => {
            expect(typeof req.query.object).to.equal('string')
            const geohash = (req.query.object as string).replaceAll('"', '')

            req.reply({
              statusCode: 200,
              body: getGeohashQueryResponse(geohash, accommodations),
            })
          },
        ).as('geoindexQuery')
        cy.contains('a', 'travel').click()
        cy.location().its('pathname').should('equal', '/travel/search')

        const queries = '0123456789bcdefghjkmnpqrstuvwxyz'
          .split('')
          .map(c => `"${c}"`)

        cy.wait('@geoindexQuery')
          .its('request.query.object')
          .should('be.oneOf', queries)

        testOffers()
        testClickOffer()
      })
    })

    it('when the geoindex fails, it should fall back to the slow querying', () => {
      cy.get<PersonAccommodation[]>('@accommodations').then(() => {
        cy.intercept(
          {
            method: 'GET',
            url: new URL('/query?object="*"', geoindexService).toString(),
          },
          { forceNetworkError: true },
        ).as('geoindexQuery')
        cy.contains('a', 'travel').click()
        cy.location().its('pathname').should('equal', '/travel/search')

        const queries = '0123456789bcdefghjkmnpqrstuvwxyz'
          .split('')
          .map(c => `"${c}"`)

        cy.wait('@geoindexQuery')
          .its('request.query.object')
          .should('be.oneOf', queries)

        testOffers()
        testClickOffer()
      })
    })
  })
})

/**
 * Given a geohash and an array of accommodations, return turtle that only contains those located within the geohash, just like the geoindex service would respond
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
