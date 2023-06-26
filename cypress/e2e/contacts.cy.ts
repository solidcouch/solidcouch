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
              cy.saveContacts({ person: me, contacts: [] })
              cy.saveContacts({
                person: person1,
                contacts: [person2.webId, person3.webId, person4.webId],
              })
              cy.saveContacts({ person: person2, contacts: [person1.webId] })
              cy.saveContacts({ person: person3, contacts: [person1.webId] })
              cy.saveContacts({ person: person4, contacts: [] })
            })
          })
        })
      })
    })
  })

  // sign in
  beforeEach(() => {
    cy.get<Person>('@me').then(me => cy.login(me))
  })

  it(
    'should show my contacts, including unconfirmed and pending, and confirm & remove button',
  )

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

  it(
    'should allow adding other person as contact and send contact request notification',
  )

  it('should allow removing other person as contact')

  it('should allow confirming other person as contact')

  it('should ignore fake contacts (not published by correct person)')
})
