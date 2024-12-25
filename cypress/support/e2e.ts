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

// before(() => {
//   // let's write our own function that checks the API using cy.request
//   // if the API responds, we are done
//   // otherwise, wait half a second and try again
//   const checkApi = () => {
//     cy.request({
//       url: Cypress.env('CSS_URL'),
//       failOnStatusCode: false,
//     })
//       .its('isOkStatusCode', { log: false })
//       .then(ok => {
//         if (ok) {
//           cy.log('API is ready')

//           return
//         }

//         cy.wait(1000, { log: false })
//         checkApi()
//       })
//   }
//   cy.visit('/')
//   checkApi()
// })

// reset app configuration before every test
beforeEach(() => cy.resetAppConfig({ waitForContent: 'Sign in' }))

// set up a community before every test
beforeEach(() => {
  cy.setupCommunity({ community: Cypress.env('COMMUNITY') }).as('community')
  cy.setupCommunity({
    community: Cypress.env('OTHER_COMMUNITY'),
    name: 'Other Community',
  }).as('otherCommunity')
})

// set up email notifications Solid identity
beforeEach(() => {
  const url = Cypress.env('EMAIL_NOTIFICATIONS_IDENTITY')
  const username = new URL(url).pathname.split('/')[1]
  cy.createAccountIfNotExist({
    username,
    password: 'correcthorsebatterystaple',
  }).as('mailbot')
})
