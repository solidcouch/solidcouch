import { UserConfig } from '../support/css-authentication'
import { CommunityConfig, SkipOptions } from '../support/setup'

const preparePod = () => {
  cy.createRandomAccount().as('user1')
}

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
  beforeEach(preparePod)

  beforeEach(() => {
    cy.get<UserConfig>('@user1').then(user => {
      cy.stubMailer({ person: { ...user, inbox: user.podUrl + 'inbox/' } })
    })
  })

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

  context('inbox is missing', () => {
    beforeEach(setupPod(['inbox']))
    it('should create inbox with correct ACL', () => {
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

  context("person's inbox is missing", () => {
    it('should create inbox')
  })

  context('email notifications are not integrated', () => {
    beforeEach(setupPod())
    it('should ask for email and integrate notifications', () => {
      cy.get<UserConfig>('@user1').then(user => {
        cy.stubMailer({
          person: { ...user, inbox: `${user.podUrl}inbox/` },
          integrated: false,
        })
        cy.login(user)
        cy.get('input[type="email"][placeholder="Your email"]')
          .should('exist')
          .type('asdf@example.com')
        cy.stubMailer({
          person: { ...user, inbox: `${user.podUrl}inbox/` },
          verified: false,
        })
        cy.intercept('POST', 'http://localhost:3005/inbox').as('integration')
        cy.contains('button', 'Continue!').click()
        cy.contains('verify your email')
        cy.wait('@integration')
          .its('request.body')
          .should('deep.equal', {
            '@id': '',
            '@context': 'https://www.w3.org/ns/activitystreams',
            '@type': 'Add',
            actor: user.webId,
            object: `${user.podUrl}inbox/`,
            target: 'asdf@example.com',
          })
      })
    })
  })

  context('everything is missing', () => {
    beforeEach(
      setupPod([
        'personalHospexDocument',
        'joinCommunity',
        'publicTypeIndex',
        'privateTypeIndex',
        'inbox',
      ]),
    )
    it('should set up everything', () => {
      cy.get<UserConfig>('@user1').then(user => {
        cy.stubMailer({
          person: { ...user, inbox: `${user.podUrl}inbox/` },
          integrated: false,
        })
        cy.login(user)
        cy.get<CommunityConfig>('@community').then(community => {
          const url = new URL(community.group)
          url.hash = ''
          cy.intercept('PATCH', url.toString()).as('addUserToCommunity')
        })
        cy.get('input[type="email"][placeholder="Your email"]')
          .should('exist')
          .type('asdf@example.com')
        cy.intercept('POST', 'http://localhost:3005/inbox').as('integration')
        // here we respond differently than real test (integration would be unverified)
        // but we respond it verified, to be able to check that everything was established and we entered the app
        cy.stubMailer({ person: { ...user, inbox: `${user.podUrl}inbox/` } })
        cy.contains('button', 'Continue!').click()
        cy.wait('@addUserToCommunity', { timeout: 10000 })
        cy.wait('@integration')
          .its('request.body')
          .should('deep.equal', {
            '@id': '',
            '@context': 'https://www.w3.org/ns/activitystreams',
            '@type': 'Add',
            actor: user.webId,
            object: `${user.podUrl}inbox/`,
            target: 'asdf@example.com',
          })
        cy.contains('a', 'travel')
      })
    })
  })
})
