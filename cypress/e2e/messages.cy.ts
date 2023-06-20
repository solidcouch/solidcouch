import { as, dct } from 'rdf-namespaces'
import { UserConfig } from '../support/css-authentication'
import { CommunityConfig, SetupConfig } from '../support/setup'

describe('messages with other person', () => {
  beforeEach(() => {
    cy.setupCommunity({ community: Cypress.env('COMMUNITY') }).as('community')

    // create and setup two people
    cy.get<CommunityConfig>('@community').then(community => {
      ;['me', 'otherPerson'].forEach((tag, i) => {
        cy.createRandomAccount().as(tag)
        cy.get<UserConfig>(`@${tag}`).then(user => {
          cy.setupPod(user, community)
            .as(`${tag}Setup`)
            .then(setup => {
              cy.setProfileData(user, setup, {
                name: `Name ${i}`,
                description: { en: `This is English description ${i}` },
              })
            })
        })
      })
    })
  })

  it('should show messages that i sent to other person')

  it('should show messages that other person sent to me')

  it('should show unread messages in inbox', () => {
    cy.get<UserConfig>('@me').then(me => {
      cy.get<UserConfig>('@otherPerson').then(otherPerson => {
        // first other person will send me a few messages
        cy.login(otherPerson)
        writeMessage(me, 'Test message')
        writeMessage(me, 'Other message')

        // sign in as me and check results
        cy.logout()
        cy.login(me)
        cy.visit(`/messages/${encodeURIComponent(otherPerson.webId)}`)
        cy.contains('Messages with')
        cy.get('[class^=Messages_message_]:not([class^=Messages_fromMe])')
          .should('have.length', 2)
          .first()
          .should('contain.text', 'Test message')
      })
    })
  })

  const writeMessage = (person: UserConfig, message: string) => {
    const path = `/messages/${encodeURIComponent(person.webId)}`
    cy.location().then(location => {
      if (location.pathname !== path) cy.visit(path)
      cy.contains('button:not([disabled])', 'Send')
      cy.get('textarea[name=message]').type(message)
      cy.contains('button', 'Send').click()
      cy.contains('[class*=Messages_fromMe]', message, { timeout: 20000 })
    })
  }

  it('should mark unread messages as read; and keep unread messages marked')

  it('should allow sending a new message to the other person')

  it('should allow sending a few messages back and forth between users, and properly setup both chats', () => {
    cy.get<UserConfig>('@me').then(me => {
      cy.get<UserConfig>('@otherPerson').then(otherPerson => {
        // first the other person will send a few messages to me
        cy.login(me)

        // my chat should get created here, referencing other person, but not other chat

        writeMessage(otherPerson, 'Test message')
        writeMessage(otherPerson, 'Other message')

        cy.get('[class^=Messages_message_]').should('have.length', 2)

        // sign in as otherPerson
        cy.logout()
        cy.login(otherPerson)

        // other chat should get created here, referencing other person, and other chat

        writeMessage(me, 'msg1')
        writeMessage(me, 'msg2')

        cy.get('[class^=Messages_message_]').should('have.length', 4)

        cy.logout()
        cy.login(me)

        // my chat should get updated here to reference the other chat
        cy.get<SetupConfig>('@meSetup').then(meSetup => {
          cy.intercept(
            'PATCH',
            `${meSetup.hospexContainer}messages/**/index.ttl`,
          ).as('updateMyChat')
        })
        writeMessage(otherPerson, 'msg...3')
        writeMessage(otherPerson, 'msg...4')

        cy.get('[class^=Messages_message_]').should('have.length', 6)
        cy.get('[class*=Messages_unread]').should('not.exist')
        cy.get<SetupConfig>('@otherPersonSetup').then(otherPersonSetup => {
          cy.wait('@updateMyChat')
            .its('request.body')
            .should('include', otherPersonSetup.hospexContainer)
            .and('include', dct.references)
        })
      })
    })
  })

  it('should be able to write across multiple days')

  it('should allow replying to a new conversation', () => {
    cy.get<UserConfig>('@me').then(me => {
      cy.get<UserConfig>('@otherPerson').then(otherPerson => {
        // first other person will send me a few messages
        cy.login(otherPerson)
        writeMessage(me, 'Test message')
        writeMessage(me, 'Other message')

        // sign in as me and check results
        cy.logout()
        cy.login(me)
        cy.visit(`/messages/${encodeURIComponent(otherPerson.webId)}`)
        cy.contains('Messages with')
        cy.get(
          '[class^=Messages_message_]:not([class*=Messages_fromMe])',
        ).should('have.length', 2)

        // my chat should get created (but only one), and it should reference the other chat
        cy.get<SetupConfig>('@meSetup').then(meSetup => {
          cy.intercept('PUT', `${meSetup.hospexContainer}**/index.ttl`).as(
            'createChat',
          )
        })
        writeMessage(otherPerson, 'Message back')
        cy.get<SetupConfig>('@otherPersonSetup').then(otherPersonSetup => {
          cy.wait('@createChat')
            .its('request.body')
            .should('include', otherPersonSetup.hospexContainer)
        })
        // it should also get referenced in privateTypeIndex, and saved}) acl
        // the notification should get deleted after being processed
        // TODO
      })
    })
  })

  it('should allow starting a new conversation', () => {
    cy.get<UserConfig>('@me').then(me => {
      cy.get<UserConfig>('@otherPerson').then(otherPerson => {
        cy.login(me)
        cy.visit(`/messages/${encodeURIComponent(otherPerson.webId)}`)
        cy.get('textarea[name=message]').type(
          'This is a first message{enter}with second line',
        )
        cy.get<SetupConfig>('@otherPersonSetup').then(otherPersonSetup => {
          cy.intercept('POST', otherPersonSetup.inbox).as('createNotification')
        })
        cy.get<SetupConfig>('@meSetup').then(meSetup => {
          cy.intercept('PATCH', meSetup.privateTypeIndex).as('updateTypeIndex')
          cy.intercept('PUT', `${meSetup.hospexContainer}**/index.ttl`).as(
            'createChat',
          )
          cy.intercept('PUT', `${meSetup.hospexContainer}**/.acl`).as(
            'createChatAcl',
          )
          cy.intercept(
            'PATCH',
            `${meSetup.hospexContainer}**/${getDate()}/chat.ttl`,
          ).as('createTodayChat')
        })
        cy.contains('button', 'Send').click()
        cy.wait('@createNotification')
          .its('response.statusCode')
          .should('equal', 201)
        cy.get('@createNotification')
          .its('request.body')
          .should('include', https(as.actor))
          .and('include', https(as.Add))
        cy.wait('@updateTypeIndex')
          .its('response.statusCode')
          .should('be.within', 200, 299)
        cy.wait('@createChat').its('response.statusCode').should('equal', 201)
        cy.wait('@createChatAcl')
          .its('response.statusCode')
          .should('equal', 201)
        cy.wait('@createTodayChat')
          .its('response.statusCode')
          .should('equal', 201)
        cy.get('[class*=Messages_fromMe]')
          .should('have.length', 1)
          .and('contain.text', 'This is a first message')
      })
    })
  })
})

/**
 * Duplicate helper to convert http to https uri
 * copied from src/utils/helpers.ts
 */
const https = (uri: string): string => {
  const url = new URL(uri)
  url.protocol = 'https'
  return url.toString()
}

describe('threads (list of conversations)', () => {
  it('should show list of active conversations with different people')
  it('should show new conversations which were started by other person')
  it('should show new conversations which were started by me')
})

const getDate = () => {
  // Get the current date
  const currentDate = new Date()

  // Extract the components of the date
  const year = currentDate.getFullYear()
  const month = String(currentDate.getMonth() + 1).padStart(2, '0')
  const day = String(currentDate.getDate()).padStart(2, '0')

  // Create the date string in YYYY/MM/DD format
  return `${year}/${month}/${day}`
}
