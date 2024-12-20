import { Person } from '../support/commands'
import { UserConfig } from '../support/css-authentication'

describe('Sign in to the app', () => {
  beforeEach(() => {
    cy.createRandomAccount().as('user1')
    cy.get<UserConfig>('@user1').then(user => {
      cy.stubMailer({
        person: { ...user, inbox: `${user.podUrl}inbox/` },
        integrated: false,
      })
    })
  })

  it('should sign in with identity provider', () => {
    cy.visit('/')
    cy.contains('Sign in').click()
    cy.get<UserConfig>('@user1').then(user1 => {
      cy.get('input[name=webIdOrIssuer]').type(`${user1.idp}{enter}`)
      cy.origin(user1.idp, { args: { user1 } }, ({ user1 }) => {
        cy.get('input[name=email]').type(user1.email)
        cy.get('input[name=password]').type(`${user1.password}{enter}`)
        cy.contains(user1.webId)
        cy.get('button#authorize').click()
      })
    })
    cy.contains('We would like to set up your Pod')
  })

  it('should sign in with webId', () => {
    cy.visit('/')
    cy.contains('Sign in').click()
    cy.get<UserConfig>('@user1').then(user1 => {
      cy.get('input[name=webIdOrIssuer]').type(`${user1.webId}{enter}`)
      cy.origin(user1.idp, { args: { user1 } }, ({ user1 }) => {
        cy.get('input[name=email]').type(user1.email)
        cy.get('input[name=password]').type(`${user1.password}{enter}`)
        cy.get('button#authorize').click()
      })
    })
    cy.contains('We would like to set up your Pod')
  })

  it('should use provided ClientID for sign-in', () => {
    cy.visit('/')
    cy.contains('Sign in').click()
    cy.get<UserConfig>('@user1').then(user1 => {
      cy.get('input[name=webIdOrIssuer]').type(`${user1.idp}{enter}`)
      cy.origin(user1.idp, { args: { user1 } }, ({ user1 }) => {
        cy.get('input[name=email]').type(user1.email)
        cy.get('input[name=password]').type(`${user1.password}{enter}`)
        // check that clientid.jsonld is used as ID
        cy.contains('clientid.jsonld')
        cy.get('button#authorize').click()
      })
    })
    cy.contains('We would like to set up your Pod')
  })

  it('should remember last identity provider selected during login', () => {
    cy.visit('/')
    cy.contains('Sign in').click()
    cy.get('input[name=webIdOrIssuer]').should('have.value', '')
    // the provider should also be the first highlighted button
    cy.get<UserConfig>('@user1').then(user1 => {
      // sign in using custom provider
      cy.login(user1)
      cy.contains('We would like to set up your Pod')
      // sign out
      cy.logout(user1)

      cy.visit('/')
      cy.contains('Sign in').click()
      // the custom provider should be filled in
      cy.get('input[name=webIdOrIssuer]').should('have.value', user1.idp)
      // the provider should also be the first highlighted button
      cy.get('[class^=SignIn_providers] button')
        .first()
        .contains(user1.idp.slice(7, -1))
    })
  })

  it('should remember last provider selected at signup', () => {
    cy.visit('/')
    cy.contains('Join').click()
    cy.get('label').contains('Show me some providers!').click()
    cy.get('[class^=Join_podOptions] a ')
      .contains('solidcommunity.net')
      // prevent opening new window (breaks CI tests)
      .invoke('removeAttr', 'target')
      .invoke('removeAttr', 'rel')
      .invoke('removeAttr', 'href')
      .click()

    // close signup and open signin
    cy.get('label').contains('Show me some providers!').type('{esc}')
    cy.contains('Sign in').click()

    // the provider should be the first highlighted button
    cy.get('[class^=SignIn_providers] button')
      .first()
      .contains('solidcommunity.net')
  })

  it('should return to previous URL after login', () => {
    cy.createPerson().as('person')
    cy.visit('/profile/edit?a=b&c=d#ef')
    cy.contains('Sign in').click()
    cy.get<Person>('@person').then(person => {
      cy.stubMailer({ person })
      cy.get('input[name=webIdOrIssuer]').type(`${person.idp}{enter}`)
      cy.origin(person.idp, { args: { person } }, ({ person }) => {
        cy.get('input[name=email]').type(person.email)
        cy.get('input[name=password]').type(`${person.password}{enter}`)
        cy.get('button#authorize').click()
      })
    })
    cy.url().should('include', '/profile/edit?a=b&c=d#ef')
  })
})
