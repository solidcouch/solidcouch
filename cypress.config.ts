import { defineConfig } from 'cypress'
import vitePreprocessor from 'cypress-vite'

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
      on('task', {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message)
          return null
        },
      })
      on('file:preprocessor', vitePreprocessor())
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
