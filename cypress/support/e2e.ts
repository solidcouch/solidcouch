// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// include chai-subset
import chaiSubset from 'chai-subset'
chai.use(chaiSubset)

// set up a community before every test
beforeEach(() => {
  cy.setupCommunity({ community: Cypress.env('COMMUNITY') }).as('community')
  cy.setupCommunity({ community: Cypress.env('OTHER_COMMUNITY') }).as(
    'otherCommunity',
  )
})
