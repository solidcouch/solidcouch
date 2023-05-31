import { UserConfig } from '../support/css-authentication'

const preparePod = () => {
  cy.createRandomAccount().then(user1 => {
    cy.wrap(user1).as('user1')
    cy.setStorage(user1)
  })
}

const resetPod = () => {}

describe('Sign in to the app', () => {
  beforeEach(resetPod)
  beforeEach(preparePod)
  it('should sign in', () => {
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
    cy.contains('We would like to set up your Pod', { timeout: 10000 })
  })
})
