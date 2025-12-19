import encodeURIComponent from 'strict-uri-encode'
import { Person } from '../support/commands'
import { UserConfig } from '../support/css-authentication'

const profile = {
  name: 'Test Name',
  description: {
    // we wanted to test multiline description, but cypress wasn't detecting it
    en: 'Hello! This is description in English.',
  },
}

const otherProfile = {
  name: 'Other Testname',
  description: { en: 'Another English description' },
}

describe('view profile', () => {
  // create and setup community and profiles
  beforeEach(() => {
    cy.createPerson(profile).as('me')
    cy.createPerson(otherProfile).as('otherPerson')
  })

  // sign in
  beforeEach(() => {
    cy.get<Person>('@me').then(person => {
      cy.stubMailer({ person })
      cy.login(person)
    })
  })

  describe('every profile', () => {
    ;[
      { name: 'me', alias: '@me', profile },
      { name: 'other person', alias: '@otherPerson', profile: otherProfile },
    ].forEach(({ name, alias, profile }) => {
      it(`[${name}] should show name, photo, about, interests; links to contacts, experiences, accommodation offers`, () => {
        cy.get<UserConfig>(alias).then(person => {
          cy.visit(`/profile/${encodeURIComponent(person.webId)}`)
          cy.contains('[data-cy=profile-name]', profile.name)
          cy.contains('[data-cy=profile-about]', profile.description.en)
          cy.contains('a', 'contacts').should(
            'have.attr',
            'href',
            `/profile/${encodeURIComponent(person.webId)}/contacts`,
          )
        })
      })

      it('should show detail when clicking an interest')

      it('TODO photo, interests; links to experiences, accommodation offers')
    })
  })

  describe('my profile', () => {
    it('[accessing uri] should show link to edit profile', () => {
      cy.get<UserConfig>('@me').then(me => {
        cy.visit(`/profile/${encodeURIComponent(me.webId)}`)
        cy.contains('a', 'edit profile').should(
          'have.attr',
          'href',
          `/profile/edit`,
        )
      })
    })

    it('[navigating through menu] should display my profile', () => {
      cy.get('[data-cy="menu-button"]').click()
      cy.get('a[href="/profile"]').click()
      cy.get<UserConfig>('@me').then(me => {
        cy.location()
          .its('pathname')
          .should('equal', `/profile/${encodeURIComponent(me.webId)}`)
      })
    })

    it('[visiting /profile] should redirect to my profile', () => {
      cy.visit('/profile')
      cy.get<UserConfig>('@me').then(me => {
        cy.location()
          .its('pathname')
          .should('equal', `/profile/${encodeURIComponent(me.webId)}`)
      })
    })
  })

  describe("other person's profile", () => {
    it('should show "write message" button', () => {
      cy.get<UserConfig>('@otherPerson').then(otherPerson => {
        cy.visit(`/profile/${encodeURIComponent(otherPerson.webId)}`)
        cy.contains('a', 'Write a message').should(
          'have.attr',
          'href',
          `/messages?with=${encodeURIComponent(otherPerson.webId)}`,
        )
      })
    })
    it(
      'TODO should show contact info and button (add to contacts, confirm contact)',
    )

    it('TODO should show "add experience" button')
  })

  describe("user doesn't exist", () => {
    it('should show a 404 page')
  })
})
