import { space } from 'rdf-namespaces'

const storage = space.storage

// prepare a few pods
const preparePod = () => {
  cy.origin('https://penny.vincenttunru.com', () => {
    cy.visit('https://penny.vincenttunru.com')
    cy.get('input#idp').clear().type('http://localhost:4000{enter}')
  })
  cy.origin('http://localhost:4000', () => {
    cy.get('input[name=email]').type('test@example.com')
    cy.get('input[name=password]').type('password{enter}')
    cy.get('button#authorize').click()
  })
  cy.origin(
    'https://penny.vincenttunru.com',
    { args: { storage } },

    ({ storage }) => {
      cy.contains('Disconnect') // wait for the redirects to finish
      cy.get('input#urlInput').type(
        'http://localhost:4000/test/profile/card{enter}',
      )
      cy.get(
        'div#http\\%3A\\%2F\\%2Flocalhost\\%3A4000\\%2Ftest\\%2Fprofile\\%2Fcard\\%23me',
      )
        .contains('button', 'New property')
        .click()
      cy.get('#newPredicate').type(storage + '{enter}')
      cy.get(`abbr[title="${storage}"]`)
        .next()
        .next()
        .contains('button', 'URL')
        .click()
      cy.get('#newUrl').type('http://localhost:4000/test/{enter}')
    },
  )
  cy.origin('http://localhost:4000', () => {
    cy.visit('http://localhost:4000/.oidc/session/end')
    cy.contains('Yes, sign me out').click()
    cy.contains('Sign-out Success')
  })
}

const uri2IdSelector = (uri: string) => {
  const encodedId = encodeURIComponent(uri)
  const cssSelector = `#${encodedId.replace(/([:.\[\],=@])/g, '\\$1')}`
  return cssSelector
}

const resetPod = () => {}

before(() => {
  cy.origin('http://localhost:4000', () => {
    cy.request({
      url: 'http://localhost:4000/test/profile/card',
      failOnStatusCode: false,
    }).then(response => {
      if (!response.isOkStatusCode) {
        cy.visit('http://localhost:4000/idp/register/', {
          headers: { accept: 'text/html' },
        })
        cy.get('input[name=podName]').type('test')
        cy.get('input[name=email]').type('test@example.com')
        cy.get('input[name=password]').type('password')
        cy.get('input[name=confirmPassword]').type('password{enter}')
      }
    })
  })
})

describe('Sign in to the app', () => {
  beforeEach(preparePod)
  afterEach(resetPod)
  it('should sign in', () => {
    cy.visit('/')
    cy.contains('Sign in').click()
    cy.get('input[name=webIdOrIssuer]').type('http://localhost:4000{enter}')
    cy.origin('http://localhost:4000', () => {
      cy.get('input[name=email]').type('test@example.com')
      cy.get('input[name=password]').type('password{enter}')
      cy.get('button#authorize').click()
    })
    cy.contains('We would like to set up your Pod')
    cy.contains('Continue').click()
  })
})
