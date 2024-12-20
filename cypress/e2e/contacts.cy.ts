import { Person } from '../support/commands'

describe("person's contacts", () => {
  // create people
  beforeEach(() => {
    ;(['me', 'person1', 'person2', 'person3', 'person4'] as const).forEach(
      tag => {
        cy.createPerson().as(tag)
      },
    )
  })

  // save testing contacts
  beforeEach(() => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@person1').then(person1 => {
        cy.get<Person>('@person2').then(person2 => {
          cy.get<Person>('@person3').then(person3 => {
            cy.get<Person>('@person4').then(person4 => {
              cy.saveContacts({
                person: me,
                // person1 - no contact
                // person2 - full contact
                // person3 - only contact to me (implement notification!)
                // person4 - only contact from me
                contacts: [person2, person4],
              })
              cy.saveContacts({
                person: person1,
                contacts: [person2, person3, person4],
              })
              cy.saveContacts({ person: person2, contacts: [me, person1] })
              cy.saveContacts({
                person: person3,
                contacts: [me, person1],
                notifications: [0],
              })
              cy.saveContacts({ person: person4, contacts: [] })
            })
          })
        })
      })
    })
  })

  // sign in
  beforeEach(() => {
    cy.get<Person>('@me').then(me => {
      cy.stubMailer({ person: me })
      cy.login(me)
    })
  })

  it('should show my contacts, including unconfirmed and pending')

  it("should show other person's confirmed (2-directional) contacts", () => {
    cy.get<Person>('@person1').then(person1 => {
      cy.get<Person>('@person2').then(person2 => {
        cy.get<Person>('@person3').then(person3 => {
          cy.visit(`/profile/${encodeURIComponent(person1.webId)}/contacts`)

          // there should be contacts with person2 and person3, but not person4 (not reciprocated)
          cy.get('[class^=Contacts_contactList]', { timeout: 15000 })
            .should(
              'contain.html',
              `href="/profile/${encodeURIComponent(person2.webId)}"`,
            )
            .and('contain.text', person2.name)
            .and(
              'contain.html',
              `href="/profile/${encodeURIComponent(person3.webId)}"`,
            )
            .and('contain.text', person3.name)
            .find('[class^=Contacts_contact__]')
            .should('have.length', 2)
        })
      })
    })
  })

  it('should allow adding other person as contact and send contact request notification', () => {
    cy.get<Person>('@person1').then(person => {
      cy.get<Person>('@me').then(me => {
        cy.visit(`/profile/${encodeURIComponent(person.webId)}`)

        cy.intercept({ method: 'POST', url: person.inbox }).as(
          'sendNotification',
        )
        cy.intercept({
          method: 'PATCH',
          url: me.hospexContainer + '.acl',
        }).as('grantHospexAccess')

        // there should be button add as contact
        cy.contains('button', 'Add to my contacts').click()
        cy.get('textarea[name=invitation]')
          .clear()
          .type('Contact invitation text')
        cy.contains('button', 'Send contact invitation').click()
        // wait for the button to update
        cy.contains('Contact request sent')
        // check that notification was sent
        cy.wait('@sendNotification')
          .its('request.body')
          .should('contain', 'Contact invitation text')
        cy.wait('@grantHospexAccess')

        // test that other person can confirm
        cy.logout(me)
        cy.stubMailer({ person })
        cy.login(person)
        cy.visit(`/profile/${encodeURIComponent(me.webId)}`)
        cy.contains('button', 'See contact invitation', {
          timeout: 20000,
        }).click()
        cy.intercept({ method: 'DELETE', url: person.inbox + '*' }).as(
          'deleteNotification',
        )
        cy.contains('button', 'Accept').click()
        cy.wait('@deleteNotification')
        cy.contains('Contact exists')
      })
    })
  })

  it('should give contacts access to my hospex')

  it('should allow removing other person from contacts')

  it('should allow confirming other person as contact from their profile', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@person3').then(person3 => {
        cy.visit(`/profile/${encodeURIComponent(person3.webId)}`)
        cy.contains('button', 'See contact invitation', {
          timeout: 20000,
        }).click()
        cy.intercept({ method: 'DELETE', url: me.inbox + '*' }).as(
          'deleteNotification',
        )
        cy.contains('button', 'Accept').click()
        cy.wait('@deleteNotification')
        cy.contains('Contact exists')
      })
    })
  })

  it('should allow confirming other person as contact from my list of contacts', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@person3').then(person3 => {
        cy.visit(`/profile/${encodeURIComponent(me.webId)}/contacts`)
        // here find the right element
        cy.contains('li', person3.name, { timeout: 20000 }).as('contact')
        cy.get('@contact')
          .should('contain.text', 'pending')
          .within(() => {
            cy.contains('button', 'process').click()
          })

        cy.intercept({ method: 'DELETE', url: me.inbox + '*' }).as(
          'deleteNotification',
        )
        cy.contains('button', 'Accept').click()
        cy.wait('@deleteNotification')
        cy.get('@contact').should('not.contain.text', 'pending')
      })
    })
  })

  it('should allow ignoring contact request', () => {
    cy.get<Person>('@me').then(me => {
      cy.get<Person>('@person3').then(person3 => {
        cy.visit(`/profile/${encodeURIComponent(person3.webId)}`)
        cy.contains('button', 'See contact invitation', {
          timeout: 20000,
        }).click()
        cy.intercept({ method: 'DELETE', url: me.inbox + '*' }).as(
          'deleteNotification',
        )
        cy.contains('button', 'Ignore').click()
        cy.wait('@deleteNotification')
        cy.contains('button', 'Add to my contacts')
      })
    })
  })

  it('should ignore fake contacts (not published by correct person)')

  it('should show number of contact requests in user menu')
})
