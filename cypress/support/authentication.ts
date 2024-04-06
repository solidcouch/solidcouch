import { UserConfig } from './css-authentication'

export const uiLogin = (user: UserConfig) => {
  cy.visit('/')
  cy.contains('Sign in').click()
  cy.get('input[name=webIdOrIssuer]').clear().type(`${user.idp}{enter}`)
  cy.origin(user.idp, { args: { user } }, ({ user }) => {
    cy.get('input[name=email]').type(user.email)
    cy.get('input[name=password]').type(`${user.password}{enter}`)
    cy.get('button#authorize').click()
  })
  // wait for sign-in in to finish
  cy.contains(/(We would like to set up your Pod)|(travel)/, { timeout: 20000 })
}

/**
 * Perform a logout from the application, and from the solid server
 */
export const uiLogout = () => {
  cy.get('[class^=Header_header] button.szh-menu-button').click()
  cy.contains('button', 'sign out').click()
  cy.contains('button', 'Sign in')
  cy.origin('http://localhost:4000', () => {
    cy.visit('/.oidc/session/end')
    cy.contains('button', 'Yes').click()
    cy.contains('Sign-out Success')
  })
}
