import { ConfigType } from '../../src/config/hooks'

/**
 * Update configuration of the tested app
 * You need to provide a content that the tests wait for before they update the app config
 */
export const updateAppConfig = (
  config: Partial<ConfigType>,
  options: { waitForContent: string },
) => {
  cy.visit('/')
  cy.window().its('updateAppConfig').should('exist')
  if (options.waitForContent) cy.contains(options.waitForContent)
  cy.window().then(window => {
    window.updateAppConfig(config)
  })
  cy.wait(1000)
  // cy.window().then(window => {
  //   cy.log(JSON.stringify(window.appConfig))
  // })
}

/**
 * Reset configuration of the tested app to original
 * You need to provide a content that the tests wait for before they reset the app config
 */
export const resetAppConfig = (options: { waitForContent: string }) => {
  cy.visit('/')
  cy.window().its('resetAppConfig').should('exist')
  if (options.waitForContent) cy.contains(options.waitForContent)
  cy.window().then(window => {
    window.resetAppConfig()
  })
  cy.wait(1000)
  // cy.window().then(window => {
  //   cy.log('reset' + JSON.stringify(window.appConfig))
  // })
}
