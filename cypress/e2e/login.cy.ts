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
})
