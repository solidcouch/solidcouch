import { UserConfig } from '../support/css-authentication'
import { CommunityConfig } from '../support/setup'

const preparePod = () => {
  cy.createRandomAccount().as('user1')
  cy.setupCommunity({ community: Cypress.env('COMMUNITY') }).as('community')
}

const resetPod = () => {}

type SkipOptions = Parameters<typeof cy.setupPod>[2]['skip'][0]
type SkipOptionsAndStorage = SkipOptions | 'storage'

const setupPod =
  (skip: SkipOptionsAndStorage[] = []) =>
  () => {
    cy.get<UserConfig>('@user1').then(user => {
      cy.get<CommunityConfig>('@community').then(community => {
        cy.setupPod(user, community, { skip: skip as SkipOptions[] })
        if (!skip.includes('storage')) {
          cy.setStorage(user)
        }
      })
    })
  }

describe('Setup Solid pod', () => {
  beforeEach(resetPod)
  beforeEach(preparePod)

  context('everything is set up', () => {
    beforeEach(setupPod())
    it('should skip the setup step', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.contains('a', 'travel')
    })
  })

  context('pim:storage is missing', () => {
    beforeEach(setupPod(['personalHospexDocument', 'storage']))
    it('should setup the pod just fine (find storage by checking parent folders)', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')
    })
  })

  context('public type index is missing', () => {
    beforeEach(setupPod(['publicTypeIndex']))
    it('should create public type index with correct ACL', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')
    })
  })

  context('private type index is missing', () => {
    beforeEach(setupPod(['privateTypeIndex']))
    it('should create private type index with correct ACL', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')
    })
  })

  context('community not joined', () => {
    beforeEach(setupPod(['joinCommunity']))
    it('should join the community', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')
    })
  })

  context('personal hospex document for this community does not exist', () => {
    beforeEach(setupPod(['personalHospexDocument']))
    it('should create personal hospex document for this community', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')
    })
  })

  context('everything is missing', () => {
    beforeEach(
      setupPod([
        'personalHospexDocument',
        'joinCommunity',
        'publicTypeIndex',
        'privateTypeIndex',
      ]),
    )
    it('should set up everything', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.get<CommunityConfig>('@community').then(community => {
        const url = new URL(community.group)
        url.hash = ''
        cy.intercept('PATCH', url.toString()).as('addUserToCommunity')
      })
      cy.contains('button', 'Continue!').click()
      cy.wait('@addUserToCommunity')
      cy.contains('a', 'travel')
    })
  })
})
