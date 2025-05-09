import { defineConfig } from 'cypress'
import vitePreprocessor from 'cypress-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const viteConfigPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  './vite.cypress.config.ts',
)

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4173',
    defaultCommandTimeout: 15000,
    // set mobile viewport as default, because we make mobile-first interface
    // this is screen size of iPhone 11, apparently a popular phone
    viewportWidth: 375,
    viewportHeight: 812,
    setupNodeEvents(on) {
      // https://github.com/cypress-io/cypress/issues/14600#issuecomment-1614013583
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'firefox') {
          // launchOptions.preferences is a map of preference names to values
          // login is not working in firefox when testing_localhost_is_secure_when_hijacked is false
          launchOptions.preferences[
            'network.proxy.testing_localhost_is_secure_when_hijacked'
          ] = true
        }

        return launchOptions
      })
      on('task', {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message)
          return null
        },
      })
      on('file:preprocessor', vitePreprocessor(viteConfigPath))
    },
  },
  env: {
    CSS_URL: 'http://localhost:4000',
    COMMUNITY: 'http://localhost:4000/test-community/community#us',
    OTHER_COMMUNITY: 'http://localhost:4000/other-community/community#us',
    EMAIL_NOTIFICATIONS_IDENTITY:
      'http://localhost:4000/mailbot/profile/card#me',
  },
  screenshotOnRunFailure: false,
  video: false,
})
