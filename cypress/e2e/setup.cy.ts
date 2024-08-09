import { processAcl } from '../../src/utils/helpers'
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

  context(
    'email notifications with solid-email-notifications are not integrated',
    () => {
      beforeEach(setupPod())

      // switch to the app on port 3001 which has the solid-email-notifications enabled
      before(() => {
        Cypress.config('baseUrl', 'http://localhost:3001')
      })
      after(() => {
        Cypress.config('baseUrl', 'http://localhost:3000')
      })

      it('should allow custom email notifications service')

      it('should make inbox readable for email notifications service identity')

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
          cy.intercept('POST', 'http://localhost:3005/inbox', {}).as(
            'integration',
          )
          cy.contains('button', 'Continue!').click()
          cy.contains('verify your email')
          cy.wait('@integration', { timeout: 15000 })
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
    },
  )

  context(
    'email notifications with simple-email-notifications are not integrated',
    () => {
      it('should ask for email and integrate notifications', () => {
        cy.get<UserConfig>('@user1').then(user => {
          // first we find out whether the user has verified email
          cy.stubMailer({
            person: { ...user, inbox: `${user.podUrl}inbox/` },
            integrated: false,
          })

          cy.login(user)

          cy.get('input[type="email"][placeholder="Your email"]')
            .should('exist')
            .type('asdf@example.com')

          cy.intercept('POST', 'http://localhost:3005/init', {}).as(
            'integration',
          )

          cy.contains('button', 'Continue!').click()

          cy.wait('@integration', { timeout: 10000 })
            .its('request.body')
            .should('deep.equal', { email: 'asdf@example.com' })

          cy.contains('verify your email')
        })
      })
    },
  )

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
        cy.intercept('POST', 'http://localhost:3005/init', {}).as('integration')
        // here we respond differently than real test (integration would be unverified)
        // but we respond it verified, to be able to check that everything was established and we entered the app
        cy.stubMailer({ person: { ...user, inbox: `${user.podUrl}inbox/` } })
        cy.contains('button', 'Continue!').click()
        cy.wait('@addUserToCommunity', { timeout: 15000 })
        cy.wait('@integration', { timeout: 15000 })
          .its('request.body')
          .should('deep.equal', { email: 'asdf@example.com' })
        cy.contains('a', 'travel')
      })
    })
  })

  context('person joined another community', () => {
    beforeEach(() => {
      cy.get<UserConfig>('@user1').then(user => {
        cy.get<CommunityConfig>('@otherCommunity').then(community => {
          cy.setupPod(user, community, {
            hospexContainerName: 'other-community',
          })
        })
      })
      setupPod([
        'personalHospexDocument',
        'joinCommunity',
        'publicTypeIndex',
        'privateTypeIndex',
        'inbox',
      ])()
    })

    it('should join this community just fine', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.get(`input[type=radio]`).first().check()
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')
    })

    it('should show option to choose other community folder, or create a new one', () => {
      cy.get<UserConfig>('@user1').then(cy.login)
      // cy.contains(
      //   'You are already a member of communities:' +
      //     Cypress.env('OTHER_COMMUNITY'),
      // )
      cy.get<UserConfig>('@user1').then(user => {
        cy.get(
          `input[type=radio][value="${user.podUrl}hospex/other-community/card"]`,
        ).check()
      })
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')

      // check that both communities still have access
      cy.get<CommunityConfig>('@community').then(community => {
        cy.get<CommunityConfig>('@otherCommunity').then(otherCommunity => {
          cy.get<UserConfig>('@user1').then(user => {
            const url = `${user.podUrl}hospex/other-community/.acl`
            cy.authenticatedRequest(user, {
              url,
              method: 'GET',
              failOnStatusCode: true,
            }).then(response => {
              cy.log(response.body)
              const acls = processAcl(url, response.body)

              const read = acls.find(
                acl => acl.accesses.length === 1 && acl.accesses[0] === 'Read',
              )

              expect(read.agentGroups)
                .to.have.length(2)
                .and.to.include(community.group)
                .and.to.include(otherCommunity.group)
            })
          })
        })
      })
    })

    it('should explain implications of choosing other community folder')

    it(
      'should use current community folder and not break it for the other community',
    )

    it('should not break email notifications of the other community')
  })
})
