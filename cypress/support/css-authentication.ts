// @ts-nocheck

/**
original file:
https://github.com/solidcryptpad/solidcryptpad/blob/74f93fee06fcb93b454f6004863647ef11e9c24f/cypress/support/css-authentication.ts

********** LICENSE **********

MIT License

Copyright (c) 2022 SolidCryptPad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// https://communitysolidserver.github.io/CommunitySolidServer/6.x/usage/client-credentials/

import {
  buildAuthenticatedFetch,
  createDpopHeader,
  generateDpopKeyPair,
} from '@inrupt/solid-client-authn-core'

export interface UserConfig {
  idp: string
  podUrl: string
  webId: string
  username: string
  password: string
  email: string
}

/**
 * requests tokens from CSS that can be used to make authenticated requests
 * and returns a fetch wrapper which uses these tokens
 */
export const getAuthenticatedRequest = (user: UserConfig) => {
  // uses https://github.com/CommunitySolidServer/CommunitySolidServer/blob/main/documentation/client-credentials.md
  return getAuthenticationToken(user).then(async ({ accessToken, dpopKey }) => {
    const authFetchWrapper = await buildAuthenticatedFetch(
      cyFetchWrapper,
      accessToken,
      { dpopKey },
    )
    const authRequest = cyUnwrapFetch(authFetchWrapper)
    return cy.wrap(authRequest, { log: false })
  })
}

/**
 * this is used to get the valid authentication headers from buildAuthenticatedFetch
 *
 * pretends to be a normal fetch
 * this can be passed to buildAuthenticatedFetch
 * and it will resolve with { options }
 */
const cyFetchWrapper = (url: string, options = {}) => {
  // mock response
  return {
    // buildAUthenticatedFetch relies on response.ok to be true. Else it checks for unauthorized errors
    ok: true,
    options,
  }
}

/**
 * return a function that looks like cy.request
 * uses the wrappedFetch to get the authentication headers
 * and makes an authenticated cy.request with it
 */
const cyUnwrapFetch = wrappedFetch => {
  return async (...cyRequestArgs) => {
    const options = parseCyRequestArgs(...cyRequestArgs)
    const pseudoResponse = await wrappedFetch(options.url, options)
    // setup options for cy.request format
    options.method ??= 'GET'
    options.headers = {
      ...Object.fromEntries(pseudoResponse.options.headers.entries()),
      ...options.headers,
    }
    return cy.request(options)
  }
}

const getAuthenticationCredentials = (user: UserConfig) => {
  const credentialsEndpoint = `${Cypress.env('cssUrl')}/idp/credentials/`
  return cy
    .request('POST', credentialsEndpoint, {
      email: user.email,
      password: user.password,
      name: 'cypress-login-token',
    })
    .then(async response => {
      const { id, secret } = response.body
      const dpopKey = await generateDpopKeyPair()
      return cy.wrap({ id, secret, dpopKey }, { log: false })
    })
}

const getAuthenticationToken = (user: UserConfig) => {
  return getAuthenticationCredentials(user).then(
    async ({ id, secret, dpopKey }) => {
      const authString = `${encodeURIComponent(id)}:${encodeURIComponent(
        secret,
      )}`
      const tokenEndpoint = `${Cypress.env('cssUrl')}/.oidc/token`
      return cy
        .request({
          method: 'POST',
          url: tokenEndpoint,
          headers: {
            authorization: `Basic ${Buffer.from(authString).toString(
              'base64',
            )}`,
            'content-type': 'application/x-www-form-urlencoded',
            dpop: await createDpopHeader(tokenEndpoint, 'POST', dpopKey),
          },
          body: 'grant_type=client_credentials&scope=webid',
        })
        .then(response => {
          const { access_token: accessToken } = response.body
          return cy.wrap({ dpopKey, accessToken }, { log: false })
        })
    },
  )
}

/**
 * parse cy.request arguments into a single options object
 *
 * @param  {...any} cyRequestArgs
 * @returns {object} options for cy.request
 */
const parseCyRequestArgs = (...cyRequestArgs) => {
  /** cy.request has multiple ways to call it
      cy.request(url)
      cy.request(url, body)
      cy.request(method, url)
      cy.request(method, url, body)
      cy.request(options)
    */
  let options = {}
  switch (cyRequestArgs.length) {
    case 1:
      if (typeof cyRequestArgs[0] === 'string') options.url = cyRequestArgs[0]
      else options = cyRequestArgs[0]
      break

    case 2:
      if (cyRequestArgs[0].startsWith('http')) {
        options.url = cyRequestArgs[0]
        options.body = cyRequestArgs[1]
      } else {
        options.method = cyRequestArgs[0]
        options.url = cyRequestArgs[1]
      }
      break

    case 3:
      options.method = cyRequestArgs[0]
      options.url = cyRequestArgs[1]
      options.body = cyRequestArgs[2]
      break
    default:
      throw new Error(
        'Tried to parse invalid cy.request arguments: ' +
          JSON.stringify(cyRequestArgs),
      )
  }
  return options
}
