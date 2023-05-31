import { defineConfig } from 'cypress'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    defaultCommandTimeout: 10000,
  },
  env: {
    cssUrl: 'http://localhost:4000',
  },
})
