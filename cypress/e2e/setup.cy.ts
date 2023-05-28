import { UserConfig } from '../support/css-authentication'
import { CommunityConfig } from '../support/setup'

const preparePod = () => {
  cy.createRandomAccount().as('user1')
  cy.setupCommunity({ community: Cypress.env('COMMUNITY') }).as('community')
}

const resetPod = () => {}

describe('Setup Solid pod', () => {
  beforeEach(resetPod)
  beforeEach(preparePod)

  context('everything is set up', () => {
    beforeEach(() => {
      cy.get<UserConfig>('@user1').then(user => {
        cy.get<CommunityConfig>('@community').then(community => {
          cy.setupPod(user, community)
        })
      })
    })
    it('should skip the setup step', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.contains('a', 'travel')
      cy.contains('a', 'host')
    })
  })

  context('pim:storage is missing', () => {
    it(
      'should setup the pod just fine (find storage by checking parent folders)',
    )
  })

  context('public type index is missing', () => {
    it('should create public type index with correct ACL')
  })

  context('private type index is missing', () => {
    it('should create private type index with correct ACL')
  })

  context('community not joined', () => {
    it('should join the community')
  })

  context('personal hospex document for this community does not exist', () => {
    it('should create personal hospex document for this community')
  })

  context('everything is missing', () => {
    it('should set up everything')
  })
})
