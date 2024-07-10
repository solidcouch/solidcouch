import { defineConfig } from 'cypress'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    // setupNodeEvents(on, config) {
    //   // implement node event listeners here
    // },
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
    },
  },
  env: {
    cssUrl: 'http://localhost:4000',
  },
  screenshotOnRunFailure: false,
  video: false,
})
