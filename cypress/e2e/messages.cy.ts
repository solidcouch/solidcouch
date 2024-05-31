import dayjs from 'dayjs'
import { as, dct } from 'rdf-namespaces'
import { Person } from '../support/commands'
import { UserConfig } from '../support/css-authentication'

/**
 * @todo TODO possibly these tests largely overlap, get rid of the overlaps
 */
describe('messages with other person', () => {
  beforeEach(() => {
    // create two people
    ;['me', 'otherPerson'].forEach((tag, i) => {
      cy.createPerson({
        name: `Name ${i}`,
        description: { en: `This is English description ${i}` },
      }).as(tag)
    })
  })

  it('should show messages that i sent to other person')

  it('should show messages that other person sent to me')

  it('should show unread messages in inbox', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@otherPerson').then(otherPerson => {
        // first other person will send me a few messages
        cy.stubMailer({ person: otherPerson })
        cy.login(otherPerson)
        writeMessage(me, 'Test message')
        writeMessage(me, 'Other message')

        // sign in as me and check results
        cy.logout()
        cy.stubMailer({ person: me })
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

  // check that toasts with info are shown and closed
  const checkAndCloseMessageInfo = () => {
    cy.testToast('Creating message')
    cy.testToast('Sending Solid notification')
    cy.testToast('Sending email notification')
    cy.testAndCloseToast('Message was created')
    cy.testAndCloseToast('Solid notification was sent')
    cy.testAndCloseToast('Email notification was sent')
  }

  /**
   * Send a message to a specified person with cypress
   * It sends a message through UI and waits until it is displayed
   */
  const writeMessage = (person: UserConfig, message: string) => {
    const path = `/messages/${encodeURIComponent(person.webId)}`
    cy.location().then(location => {
      if (location.pathname !== path) cy.visit(path)
      cy.contains('button:not([disabled])', 'Send')
      cy.get('textarea[name=message]').type(message)
      cy.contains('button', 'Send').click()
      checkAndCloseMessageInfo()
      cy.contains('[class*=Messages_fromMe]', message, { timeout: 20000 })
    })
  }

  it('should mark unread messages as read; and keep unread messages marked')

  it('should process message notifications and delete them', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@otherPerson').then(otherPerson => {
        // my chat should get updated here to reference the other chat
        cy.intercept('PUT', `${me.hospexContainer}messages/**/index.ttl`).as(
          'createMyChat',
        )
        cy.intercept('PATCH', `${me.hospexContainer}messages/**/index.ttl`).as(
          'updateMyChat',
        )
        cy.intercept('DELETE', `${me.inbox}**`).as('deleteMyNotification')
        cy.intercept(
          'PUT',
          `${otherPerson.hospexContainer}messages/**/index.ttl`,
        ).as('createOtherPersonChat')
        cy.intercept(
          'PATCH',
          `${otherPerson.hospexContainer}messages/**/index.ttl`,
        ).as('updateOtherPersonChat')
        cy.intercept('DELETE', `${otherPerson.inbox}**`).as(
          'deleteOtherPersonNotification',
        )

        cy.stubMailer({ person: me })
        cy.login(me)

        writeMessage(otherPerson, 'Test message')
        writeMessage(otherPerson, 'Other message')

        cy.get('[class^=Messages_message_]').should('have.length', 2)

        // sign in as otherPerson
        cy.logout()
        cy.stubMailer({ person: otherPerson })
        cy.login(otherPerson)

        // other chat should get created here, referencing other person, and other chat
        cy.get('@deleteOtherPersonNotification.all').should('have.length', 0)

        writeMessage(me, 'msg1')
        writeMessage(me, 'msg2')

        // 2 notifications should be deleted
        cy.wait('@deleteOtherPersonNotification')
        cy.wait('@deleteOtherPersonNotification')

        cy.get('[class^=Messages_message_]').should('have.length', 4)

        cy.logout()
        cy.stubMailer({ person: me })
        cy.login(me)

        writeMessage(otherPerson, 'msg...3')
        writeMessage(otherPerson, 'msg...4')
        cy.get('[class^=Messages_message_]').should('have.length', 6)
        // cy.get('[class*=Messages_unread]').should('have.length', 2)
        cy.wait('@updateMyChat')
          .its('request.body')
          .should('include', otherPerson.hospexContainer)
          .and('include', dct.references)

        // 2 notifications should be deleted
        cy.wait('@deleteMyNotification')
        cy.wait('@deleteMyNotification')

        // TODO test the looks of updating unread messages
      })
    })
  })

  it('should allow sending a new message to the other person')

  it('should allow sending a few messages back and forth between users, and properly setup both chats', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@otherPerson').then(otherPerson => {
        // first the other person will send a few messages to me
        cy.stubMailer({ person: me })
        cy.login(me)

        // my chat should get created here, referencing other person, but not other chat

        writeMessage(otherPerson, 'Test message')
        writeMessage(otherPerson, 'Other message')

        cy.get('[class^=Messages_message_]').should('have.length', 2)

        // sign in as otherPerson
        cy.logout()
        cy.stubMailer({ person: otherPerson })
        cy.login(otherPerson)

        // other chat should get created here, referencing other person, and other chat

        writeMessage(me, 'msg1')
        writeMessage(me, 'msg2')

        cy.get('[class^=Messages_message_]').should('have.length', 4)

        cy.logout()
        cy.stubMailer({ person: me })
        cy.login(me)

        // my chat should get updated here to reference the other chat
        cy.intercept('PATCH', `${me.hospexContainer}messages/**/index.ttl`).as(
          'updateMyChat',
        )
        writeMessage(otherPerson, 'msg...3')
        writeMessage(otherPerson, 'msg...4')

        cy.get('[class^=Messages_message_]').should('have.length', 6)
        // cy.get('[class*=Messages_unread]').should('have.length', 2)
        cy.wait('@updateMyChat')
          .its('request.body')
          .should('include', otherPerson.hospexContainer)
          .and('include', dct.references)
      })
    })
  })

  it('should be able to write across multiple days')

  it('should allow replying to a new conversation', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@otherPerson').then(otherPerson => {
        // first other person will send me a few messages
        cy.stubMailer({ person: otherPerson })
        cy.login(otherPerson)
        writeMessage(me, 'Test message')
        writeMessage(me, 'Other message')

        // sign in as me and check results
        cy.logout()
        cy.stubMailer({ person: me })
        cy.login(me)
        cy.visit(`/messages/${encodeURIComponent(otherPerson.webId)}`)
        cy.contains('Messages with')
        cy.get(
          '[class^=Messages_message_]:not([class*=Messages_fromMe])',
        ).should('have.length', 2)

        // my chat should get created (but only one), and it should reference the other chat
        cy.intercept('PUT', `${me.hospexContainer}**/index.ttl`).as(
          'createChat',
        )
        writeMessage(otherPerson, 'Message back')
        cy.wait('@createChat')
          .its('request.body')
          .should('include', otherPerson.hospexContainer)
        // it should also get referenced in privateTypeIndex, and saved}) acl
        // the notification should get deleted after being processed
        // TODO
      })
    })
  })

  it('should be able to ignore received messages', () => {})

  it('should allow starting a new conversation', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@otherPerson').then(otherPerson => {
        cy.stubMailer({ person: me })
        cy.login(me)
        cy.intercept('POST', otherPerson.inbox).as('createNotification')
        cy.intercept('PATCH', me.privateTypeIndex).as('updateTypeIndex')
        cy.intercept('PUT', `${me.hospexContainer}**/index.ttl`).as(
          'createChat',
        )
        cy.intercept('PUT', `${me.hospexContainer}**/.acl`).as('createChatAcl')
        cy.intercept(
          'PATCH',
          `${me.hospexContainer}**/${dayjs().format('YYYY/MM/DD')}/chat.ttl`,
        ).as('createTodayChat')

        writeMessage(otherPerson, 'This is a first message')

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

  context('simple email notifications enabled', () => {
    it('should ask the simple email notifications service to send email notification to receiver', () => {
      cy.get<Person>('@me').then(me => {
        cy.get<Person>('@otherPerson').then(otherPerson => {
          cy.stubMailer({ person: me })
          cy.login(me)
          writeMessage(otherPerson, 'Test message')
          cy.wait('@simpleEmailNotification')
            .its('request.body')
            .should('containSubset', {
              '@context': 'https://www.w3.org/ns/activitystreams',
              type: 'Create',
              actor: {
                type: 'Person',
                id: me.webId,
                name: me.name,
              },
              object: {
                type: 'Note',
                content: 'Test message',
              },
              target: {
                type: 'Person',
                id: otherPerson.webId,
                name: otherPerson.name,
              },
            })
        })
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
