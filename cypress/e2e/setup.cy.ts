import { Parser, Store } from 'n3'
import { foaf, ldp, sioc, solid, space, vcard } from 'rdf-namespaces'
import { processAcl, removeHashFromURI } from '../../src/utils/helpers'
import {
  getAuthenticatedFetch,
  UserConfig,
} from '../support/css-authentication'
import { generateAcl } from '../support/helpers/acl'
import {
  CommunityConfig,
  SkipOptions,
  throwIfResponseNotOk,
} from '../support/setup'

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
      cy.login('@user1')
      cy.contains('a', 'travel')
    })
  })

  context('pim:storage is missing', () => {
    beforeEach(setupPod(['personalHospexDocument', 'storage']))
    it('should setup the pod just fine (find storage by checking parent folders)', () => {
      cy.login('@user1')
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
      cy.login('@user1')
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')
    })
  })

  context('inbox is missing', () => {
    beforeEach(setupPod(['inbox']))
    it('should create inbox with correct ACL', () => {
      cy.login('@user1')
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

  context('community not joined (new join service)', () => {
    const inboxUrl = `https://inbox.community.org/inbox`

    beforeEach(() => {
      cy.get<CommunityConfig>('@community')
        .then(com => {
          // add an inbox to the community
          cy.authenticatedRequest(com.user, {
            url: com.community,
            method: 'PATCH',
            headers: { 'content-type': 'text/n3' },
            body: `
          _:addInbox a <${solid.InsertDeletePatch}>;
          <${solid.inserts}> { <${com.community}> <${ldp.inbox}> <${inboxUrl}>. }.
          `,
          })

          // change access rights of the group to read only
          const resource = (() => {
            const url = new URL(com.group)
            url.hash = ''
            return url.toString()
          })()
          const groupAcl = generateAcl(resource, [
            {
              permissions: ['Read', 'Write', 'Append', 'Control'],
              agents: [com.user.webId],
            },
            {
              permissions: ['Read', 'Write'],
              agents: ['https://inbox.community.org/profile/card#bot'],
            },
            { permissions: ['Read'], agentClasses: [foaf.Agent] },
          ])
          cy.authenticatedRequest(com.user, {
            url: resource + '.acl',
            method: 'PUT',
            body: groupAcl,
            headers: { 'content-type': 'text/turtle' },
          })

          // mock requests to that inbox
          cy.intercept<{
            actor: { id: string }
          }>('POST', inboxUrl, async req => {
            const authFetch = await getAuthenticatedFetch(com.user)
            const altRes = await authFetch(com.group, {
              method: 'PATCH',
              headers: { 'content-type': `text/n3` },
              body: `_:insertPerson a <${solid.InsertDeletePatch}>;
            <${solid.inserts}> { <${com.group}> <${vcard.hasMember}> <${req.body.actor.id}>. }.`,
            })
            await throwIfResponseNotOk(altRes)
            return req.reply({
              statusCode: 200,
              headers: { location: com.group },
            })
          })
        })
        .as('joinActivity')
    })

    beforeEach(setupPod(['joinCommunity']))

    it('should send a `Join` activity to community inbox', () => {
      cy.get<CommunityConfig>('@community').then(community => {
        cy.get<UserConfig>('@user1').then(user => {
          cy.login(user)
          cy.contains('button', 'Continue!')
          cy.intercept('GET', removeHashFromURI(community.group)).as(
            'groupUpdate',
          )
          cy.contains('button', 'Continue!').click()

          // check that the activity was sent to inbox
          cy.wait('@joinActivity')
            .its('request.body')
            .should('deep.nested.include', {
              actor: { type: 'Person', id: user.webId },
              object: { type: 'Group', id: community.community },
            })

          // check that the group was refetched afterwards
          cy.wait('@groupUpdate')
        })
      })
      cy.contains('a', 'travel')
    })
  })

  context('personal hospex document for this community does not exist', () => {
    beforeEach(setupPod(['personalHospexDocument']))
    it('should create personal hospex document for this community', () => {
      cy.login('@user1')
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')
    })
  })

  context(
    'email notifications with solid-email-notifications are not integrated',
    () => {
      beforeEach(setupPod())

      beforeEach(() => {
        cy.updateAppConfig(
          { emailNotificationsType: 'solid' },
          { waitForContent: 'Sign in' },
        )
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
      beforeEach(() => {
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
        })
      })

      it('should ask for email and integrate notifications', () => {
        cy.contains('button', 'Continue!').click()

        cy.wait('@integration', { timeout: 10000 })
          .its('request.body')
          .should('deep.equal', { email: 'asdf@example.com' })

        cy.contains('verify your email')
      })

      it('should prepare pod for storing email verification', () => {
        cy.contains('button', 'Continue!').click()

        cy.wait('@integration', { timeout: 15000 })
        cy.contains('verify your email')

        // preparation means:
        // - giving the notification bot read access to the hospex document
        // - creating an email settings file for storing proof that email was verified
        // - giving the notification bot read and write access to the email settings
        // - linking email settings from hospex document

        cy.get<UserConfig>('@user1').then(user => {
          const hospexUrl = `${user.podUrl}hospex/dev-solidcouch/card`
          cy.get<UserConfig>('@mailbot').then(bot => {
            // - bot read access to hospex document
            cy.authenticatedRequest(bot, {
              url: hospexUrl,
              method: 'GET',
              failOnStatusCode: true,
            }).then(response => {
              expect(response.status).to.equal(200)
              cy.wrap(response.body).as('hospexDocumentBody')
            })
            // - linking email settings from hospex document
            cy.get<string>('@hospexDocumentBody').then(body => {
              const store = new Store(
                new Parser({ baseIRI: hospexUrl }).parse(body),
              )

              const settings = store
                .getObjects(user.webId, space.preferencesFile, null)
                .map(a => a.value)

              expect(settings).to.have.length(1)
              cy.wrap(settings[0]).as('mailerConfig')
            })

            // - creating an email settings file for storing proof that email was verified
            // - giving the notification bot read and write access to the email settings
            cy.get<string>('@mailerConfig').then(mailerConfig => {
              cy.authenticatedRequest(bot, {
                url: mailerConfig,
                method: 'GET',
                failOnStatusCode: true,
              })
                .its('status')
                .should('equal', 200)

              cy.authenticatedRequest(bot, {
                url: mailerConfig,
                method: 'PATCH',
                headers: { 'content-type': 'text/n3' },
                body: `_:mutate a <${solid.InsertDeletePatch}>;
                  <${solid.inserts}> {
                    <#this> a <#test>.
                  }.`,
              })
                .its('status')
                .should('be.within', 200, 299)
            })
          })
        })
      })

      it('should not overwrite other email service settings in the pod', () => {
        // first we set up other email service settings
        cy.get<CommunityConfig>('@otherCommunity').then(otherCommunity => {
          cy.logout('@user1')
          cy.createRandomAccount()
            .as('mailbot2')
            .then(bot => {
              cy.updateAppConfig(
                {
                  emailNotificationsIdentity: bot.webId,
                  communityContainer: 'other-community',
                  communityId: otherCommunity.community,
                },
                { waitForContent: 'Sign in' },
              )
              cy.login('@user1')
              cy.visit('/')
              cy.contains('other-community')
              cy.get('input[type="email"][placeholder="Your email"]')
                .should('exist')
                .type('other-email@example.com')
              cy.contains('button', 'Continue!').click()
            })
        })
        cy.wait('@integration', { timeout: 10000 })
          .its('request.body')
          .should('deep.equal', { email: 'other-email@example.com' })

        cy.logout('@user1')

        // then we set up the current email service settings
        cy.resetAppConfig({ waitForContent: 'Sign in' })
        cy.login('@user1')
        cy.contains('dev-solidcouch')
        cy.get(`input[type=radio]`).should('have.length', 2).last().check()
        cy.get('input[type="email"][placeholder="Your email"]')
          .should('exist')
          .type('third-email@example.com')
        cy.contains('button', 'Continue!').click()
        cy.wait('@integration', { timeout: 10000 })
          .its('request.body')
          .should('deep.equal', { email: 'third-email@example.com' })
        cy.contains('verify your email')

        // now we want to check that both mail bots have access to their respective settings

        const accessDocument = (
          url: string,
          user: string,
          response: string,
        ) => {
          cy.get<UserConfig>(`@${user}`).then(u => {
            cy.authenticatedRequest(u, { url, failOnStatusCode: false }).as(
              response,
            )
          })
        }

        const checkDocumentAccess = (
          response: string,
          status?: number,
          access?: ('read' | 'write' | 'append')[],
        ) => {
          cy.get<Cypress.Response<unknown>>(`@${response}`).then(resp => {
            if (status) expect(resp.status).to.equal(status)
            if (access) {
              if (access.includes('write')) access.push('append')
              expect(resp.headers['wac-allow']).to.equal(
                `user="${access.sort().join(' ')}"`,
              )
            }
          })
        }

        cy.get<UserConfig>('@user1').then(user => {
          const hospexUrl = `${user.podUrl}hospex/other-community/card`

          ;['mailbot', 'mailbot2'].forEach((bot, i) => {
            accessDocument(hospexUrl, bot, 'hospexDocument' + (i + 1))
            checkDocumentAccess('hospexDocument' + (i + 1), 200, ['read'])
          })

          cy.get<Cypress.Response<string>>('@hospexDocument1').then(
            response1 => {
              cy.get<Cypress.Response<string>>('@hospexDocument2').then(
                response2 => {
                  expect(response1.body).to.equal(response2.body)
                },
              )
            },
          )

          // - linking email settings from hospex document
          cy.get<Cypress.Response<string>>('@hospexDocument1').then(
            response => {
              const store = new Store(
                new Parser({ baseIRI: hospexUrl }).parse(response.body),
              )

              const settings = store
                .getObjects(user.webId, space.preferencesFile, null)
                .map(a => a.value)

              expect(settings).to.have.length(2)
              cy.wrap(settings).as('settingsList')
            },
          )
        })

        // access both notification settings by both identities
        cy.get<string[]>('@settingsList').then(settingsList => {
          settingsList.forEach((s, i) => {
            ;['mailbot', 'mailbot2'].forEach(bot => {
              accessDocument(s, bot, bot + 'Settings' + (i + 1))
            })
          })
        })

        // one mailer should be able to access one mailer config
        // and another mailer should be able to access the other mailer config
        // and have read and write access
        cy.get<Cypress.Response<unknown>>('@mailbotSettings1').then(m1s1 => {
          cy.get<Cypress.Response<unknown>>('@mailbotSettings2').then(m1s2 => {
            cy.get<Cypress.Response<unknown>>('@mailbot2Settings1').then(
              m2s1 => {
                cy.get<Cypress.Response<unknown>>('@mailbot2Settings2').then(
                  m2s2 => {
                    // each mailer can access one config
                    expect(m1s1.status).to.be.oneOf([200, 403])
                    expect(m1s2.status).to.equal(
                      m1s1.status === 200 ? 403 : 200,
                    )
                    expect(m2s1.status).to.equal(
                      m1s1.status === 200 ? 403 : 200,
                    )
                    expect(m2s2.status).to.equal(
                      m1s1.status === 200 ? 200 : 403,
                    )
                    // and each mailer should have read and write access to its config
                    ;(
                      [
                        ['mailbotSettings1', m1s1],
                        ['mailbotSettings2', m1s2],
                        ['mailbot2Settings1', m2s1],
                        ['mailbot2Settings2', m2s2],
                      ] as const
                    )
                      .filter(([, ms]) => ms.status === 200)
                      .forEach(([handler]) => {
                        checkDocumentAccess(handler, 200, ['read', 'write'])
                      })
                  },
                )
              },
            )
          })
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

    it('should show option to create a new community folder, and join this community just fine', () => {
      cy.get<UserConfig>('@user1').then(user => cy.login(user))
      cy.get(`input[type=radio]`).first().check()
      cy.contains('button', 'Continue!').click()
      cy.contains('a', 'travel')
    })

    it('should show option to choose existing community folder, and not break it when adding the community', () => {
      cy.get<UserConfig>('@user1').then(cy.login)
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
            const aclUrl = `${user.podUrl}hospex/other-community/.acl`
            cy.authenticatedRequest(user, {
              url: aclUrl,
              method: 'GET',
              failOnStatusCode: true,
            }).then(response => {
              const acls = processAcl(aclUrl, response.body)

              const read = acls.find(
                acl => acl.modes.length === 1 && acl.modes[0] === 'Read',
              )

              if (!read) throw new Error('read not found')

              expect(read.agentGroups)
                .to.have.length(2)
                .and.to.include(community.group)
                .and.to.include(otherCommunity.group)
            })

            const url = `${user.podUrl}hospex/other-community/card`

            cy.authenticatedRequest(user, {
              url,
              method: 'GET',
              failOnStatusCode: true,
            }).then(response => {
              const parser = new Parser({ baseIRI: url })
              const store = new Store(parser.parse(response.body))

              const communities = store
                .getObjects(user.webId, sioc.member_of, null)
                .map(a => a.value)
              expect(communities)
                .to.have.length(2)
                .and.to.include(community.community)
                .and.to.include(otherCommunity.community)
            })
          })
        })
      })
    })

    it('should explain implications of choosing other community folder')

    it('should not break email notifications of the other community')
  })
})
