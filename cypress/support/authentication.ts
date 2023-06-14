import { UserConfig } from './css-authentication'

export const uiLogin = (user: UserConfig) => {
  cy.visit('/')
  cy.contains('Sign in').click()
  cy.get('input[name=webIdOrIssuer]').type(`${user.idp}{enter}`)
  cy.origin(user.idp, { args: { user } }, ({ user }) => {
    cy.get('input[name=email]').type(user.email)
    cy.get('input[name=password]').type(`${user.password}{enter}`)
    cy.get('button#authorize').click()
  })
  // wait for sign-in in to finish
  cy.contains(/(We would like to set up your Pod)|(travel)/, { timeout: 20000 })
}
