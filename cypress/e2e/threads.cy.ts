import { Person } from '../support/commands'

describe('threads (list of conversations)', () => {
  beforeEach(() => {
    // create and setup people
    ;['me', 'person1', 'person2'].forEach((tag, i) => {
      cy.createPerson({
        name: `Name ${i}`,
        description: { en: `This is English description ${i}` },
      }).as(tag)
    })
  })

  // stub mailer
  beforeEach(() => {
    cy.get<Person>('@me').then(me => {
      cy.stubMailer({ person: me })
    })
  })

  it('should show list of active conversations with different people', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@person1').then(person1 => {
        cy.get<Person>('@person2').then(person2 => {
          cy.createConversation({
            participations: [{ person: me }, { person: person1 }],
            messages: [
              {
                message: 'message1',
                created: new Date('2022-01-21'),
                chat: 1,
                notifications: [],
              },
              {
                message: 'message2',
                created: new Date('2023-06-24 10:00:00'),
                chat: 0,
                notifications: [],
              },
              {
                message: 'message3',
                created: new Date('2023-06-24 17:46:23'),
                chat: 1,
                notifications: [0],
              },
            ],
          })
          cy.createConversation({
            participations: [{ person: me }, { person: person2 }],
            messages: [
              {
                message: 'other message 1',
                created: new Date('2023-06-20'),
                chat: 0,
                notifications: [],
              },
              {
                message: 'other message 2',
                created: new Date('2023-06-21 10:00:00'),
                chat: 1,
                notifications: [],
              },
            ],
          })
          cy.login(me)
          cy.visit('/messages')
          cy.contains('h1', 'Conversations')
          cy.get('[data-cy=thread-list-item]')
            .should('have.length', 2)
            .first()
            .should('contain.text', 'message3')
            .and(
              'contain.html',
              `href="/messages/${encodeURIComponent(person1.webId)}"`,
            )
            .and('contain.text', person1.name)
            .next()
            .should(
              'contain.html',
              `href="/messages/${encodeURIComponent(person2.webId)}"`,
            )
            .and('contain.text', 'other message 2')
            .and('contain.text', person2.name)

          cy.get('[data-cy=thread-unread]')
            .should('have.length', 1)
            .and('contain.text', person1.name)
        })
      })
    })
  })

  it('should show new conversations which were started by other person', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@person1').then(person1 => {
        cy.createConversation({
          participations: [
            { person: me, setupChat: false },
            { person: person1 },
          ],
          messages: [
            {
              message: 'message1',
              created: new Date('2023-06-22'),
              chat: 1,
              notifications: [0],
            },
            {
              message: 'message2',
              created: new Date('2023-06-24 10:00:00'),
              chat: 1,
              notifications: [0],
            },
          ],
        })
        cy.login(me)
        cy.visit('/messages')
        cy.contains('h1', 'Conversations')
        cy.get('[data-cy=thread-list-item]')
          .should('have.length', 1)
          .and('contain.html', 'data-cy="thread-unread"')
          .and(
            'contain.html',
            `href="/messages/${encodeURIComponent(person1.webId)}"`,
          )
          .and('contain.text', 'message2')
      })
    })
  })

  it('should show new conversations which were started by me', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@person1').then(person1 => {
        // setup situation after i sent a message and the other person replied to it, but i didn't read it, yet
        // so my part of chat doesn't reference the other person's chat
        cy.createConversation({
          participations: [
            { person: me, skipReferences: [1] },
            { person: person1 },
          ],
          messages: [
            {
              message: 'message1',
              created: new Date('2023-06-22'),
              chat: 0,
              notifications: [],
            },
            {
              message: 'message2',
              created: new Date('2023-06-24 10:00:00'),
              chat: 1,
              notifications: [0],
            },
          ],
        })
        cy.login(me)
        cy.visit('/messages')
        cy.contains('h1', 'Conversations')
        cy.get('[data-cy=thread-list-item]')
          .should('have.length', 1)
          .and('contain.html', 'data-cy="thread-unread"')
          .and(
            'contain.html',
            `href="/messages/${encodeURIComponent(person1.webId)}"`,
          )
          .and('contain.text', 'message2')
      })
    })
  })

  it('should show unread messages in main menu', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@person1').then(person1 => {
        cy.get<Person>('@person2').then(person2 => {
          cy.createConversation({
            participations: [{ person: me }, { person: person1 }],
            messages: [
              {
                message: 'message1',
                created: new Date('2022-01-21'),
                chat: 1,
                notifications: [],
              },
              {
                message: 'message2',
                created: new Date('2023-06-24 10:00:00'),
                chat: 0,
                notifications: [],
              },
              {
                message: 'message3',
                created: new Date('2023-06-24 17:46:23'),
                chat: 1,
                notifications: [0],
              },
            ],
          })
          cy.createConversation({
            participations: [{ person: me }, { person: person2 }],
            messages: [
              {
                message: 'other message 1',
                created: new Date('2023-06-20'),
                chat: 0,
                notifications: [],
              },
              {
                message: 'other message 2',
                created: new Date('2023-06-21 10:00:00'),
                chat: 1,
                notifications: [0],
              },
              {
                message: 'other message 3',
                created: new Date('2023-06-21 10:00:00'),
                chat: 1,
                notifications: [0],
              },
            ],
          })
          cy.login(me)
          cy.get('[data-cy="menu-button"]').click()
          cy.contains('a', 'messages (3 new)').should(
            'have.attr',
            'href',
            '/messages',
          )
        })
      })
    })
  })

  it('should show unread messages on main page messages', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@person1').then(person1 => {
        cy.get<Person>('@person2').then(person2 => {
          cy.createConversation({
            participations: [{ person: me }, { person: person1 }],
            messages: [
              {
                message: 'message1',
                created: new Date('2022-01-21'),
                chat: 1,
                notifications: [],
              },
              {
                message: 'message2',
                created: new Date('2023-06-24 10:00:00'),
                chat: 0,
                notifications: [],
              },
              {
                message: 'message3',
                created: new Date('2023-06-24 17:46:23'),
                chat: 1,
                notifications: [0],
              },
            ],
          })
          cy.createConversation({
            participations: [{ person: me }, { person: person2 }],
            messages: [
              {
                message: 'other message 1',
                created: new Date('2023-06-20'),
                chat: 0,
                notifications: [],
              },
              {
                message: 'other message 2',
                created: new Date('2023-06-21 10:00:00'),
                chat: 1,
                notifications: [0],
              },
              {
                message: 'other message 3',
                created: new Date('2023-06-21 10:00:00'),
                chat: 1,
                notifications: [0],
              },
            ],
          })
          cy.login(me)

          cy.intercept({ method: 'DELETE', url: me.inbox + '*' }).as(
            'deleteNotification',
          )

          cy.contains('a', '(3 new)').click()
          cy.contains('a', person2.name).click()
          cy.wait('@deleteNotification', { timeout: 20000 })
          cy.wait('@deleteNotification', { timeout: 20000 })
          cy.get('[data-cy=header-logo-link]').click()
          cy.contains('a', '(1 new)')
        })
      })
    })
  })
})
