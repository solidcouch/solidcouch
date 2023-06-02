import { UserConfig } from '../support/css-authentication'
import { CommunityConfig } from '../support/setup'

const profile = {
  name: 'Test Name',
  description: {
    en: 'Hello! This is description in English.\nIt has multiple lines.',
  },
}

describe('view profile', () => {
  // create and setup community and profiles
  beforeEach(() => {
    cy.setupCommunity({ community: Cypress.env('COMMUNITY') }).as('community')
    cy.createRandomAccount().as('me')
    cy.createRandomAccount().as('otherPerson')
    cy.get<CommunityConfig>('@community').then(community => {
      cy.get<UserConfig>('@me').then(user => {
        cy.setupPod(user, community).then(setup => {
          cy.setProfileData(user, setup, profile)
        })
      })
      cy.get<UserConfig>('@otherPerson').then(user => {
        cy.setupPod(user, community)
      })
    })
  })

  // sign in
  beforeEach(() => {
    cy.get<UserConfig>('@me').then(user => {
      cy.login(user)
    })
  })

  describe('my profile', () => {
    it('[navigating through menu] should display my profile', () => {
      cy.get('[class^=Header_header] .szh-menu-button').click()
      cy.get('a[href="/profile"]').click()
      cy.get<UserConfig>('@me').then(me => {
        cy.location()
          .its('pathname')
          .should('equal', `/profile/${encodeURIComponent(me.webId)}`)
      })

      cy.contains('[class^=Profile_name]', profile.name)
    })
  })

  describe("other person's profile", () => {})
})
