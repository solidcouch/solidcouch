import { logoutUser, UserConfig } from './css-authentication'

const resolveUser = (
  user: UserConfig | `@${string}`,
): Cypress.Chainable<UserConfig> => {
  if (typeof user === 'string') {
    // Fetch the UserConfig using the Cypress alias
    return cy.get<UserConfig>(user)
  }
  // Wrap the UserConfig into a Cypress chainable
  return cy.wrap(user, { log: false })
}

export const uiLogin = (user: UserConfig | `@${string}`) => {
  resolveUser(user).then(user => {
    cy.visit('/')
    cy.contains('Sign in').click()
    cy.get('input[name=webIdOrIssuer]').clear().type(`${user.idp}{enter}`)
    cy.origin(user.idp, { args: { user } }, ({ user }) => {
      cy.get('input[name=email]').type(user.email)
      cy.get('input[name=password]').type(`${user.password}{enter}`)
      cy.contains(user.webId)
      cy.get('button#authorize').click()
    })
  })
  // wait for sign-in in to finish
  cy.contains(/(We would like to set up your Pod)|(travel)/, { timeout: 20000 })
}

/**
 * Perform a logout from the application, and from the solid server
 */
export const uiLogout = (user: UserConfig | `@${string}`) => {
  cy.get('[class^=Header_header] button.szh-menu-button').click()
  cy.contains('button', 'sign out').click()
  cy.contains('button', 'Sign in')
  cy.origin(Cypress.env('CSS_URL'), () => {
    cy.visit('/.oidc/session/end')
    cy.contains('button', 'Yes').click()
    cy.contains('Sign-out Success')
  })

  resolveUser(user).then(resolvedUser => {
    logoutUser(resolvedUser)
  })
}
