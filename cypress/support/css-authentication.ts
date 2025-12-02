import {
  createDpopHeader,
  generateDpopKeyPair,
  KeyPair,
} from '@inrupt/solid-client-authn-core'
import { v7 } from 'css-authn'
import encodeURIComponent from 'strict-uri-encode'
import { buildAuthenticatedFetch } from './buildAuthenticatedFetch'
import { cyFetchWrapper, cyUnwrapFetch } from './css-authentication-helpers'

export interface UserConfig {
  oidcIssuer: string
  podUrl: string
  webId: string
  username: string
  password: string
  email: string
}

interface Controls {
  controls: {
    account: { clientCredentials: string; logout: string }
    password: { login: string }
  }
}

const getAccountAuthorization = (user: UserConfig) =>
  cy
    .request<Controls>({
      url: `${Cypress.env('CSS_URL')}/.account/`,
      log: false,
    })
    .then(response =>
      cy.request<{ authorization: string }>({
        url: response.body.controls.password.login,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: {
          email: user.email,
          password: user.password,
        },
        log: false,
      }),
    )
    .then(response => cy.wrap(response.body.authorization, { log: false }))

const getControls = (authorization: string) =>
  cy
    .request<Controls>({
      url: `${Cypress.env('CSS_URL')}/.account/`,
      headers: { authorization: `CSS-Account-Token ${authorization}` },
      log: false,
    })
    .then(controlResponse => cy.wrap(controlResponse.body.controls))

export const logoutUser = (user: UserConfig) =>
  getAccountAuthorization(user)
    .then(getControls)
    .then(controls =>
      cy.request({ url: controls.account.logout, method: 'POST' }),
    )

const getIdAndSecret = ({
  webId,
  authorization,
}: {
  webId: string
  authorization: string
}) =>
  getControls(authorization).then(controls => {
    return cy
      .request<{ id: string; secret: string }>({
        url: controls.account.clientCredentials,
        method: 'POST',
        headers: {
          authorization: `CSS-Account-Token ${authorization}`,
          'content-type': 'application/json',
        },
        // The name field will be used when generating the ID of your token.
        // The WebID field determines which WebID you will identify as when using the token.
        // Only WebIDs linked to your account can be used.
        body: { name: 'cypress-login-token', webId },
        log: false,
      })
      .then(response =>
        cy
          .request<void>({
            url: controls.account.logout,
            method: 'POST',
            log: false,
          })
          .then(() => cy.wrap(response.body, { log: false })),
      )
  })

const getAccessToken = ({ id, secret }: { id: string; secret: string }) => {
  const tokenUrl = `${Cypress.env('CSS_URL')}/.oidc/token`
  return cy
    .wrap<Promise<KeyPair>, KeyPair>(generateDpopKeyPair(), { log: false })
    .then(dpopKey =>
      cy
        .wrap<Promise<string>, string>(
          createDpopHeader(tokenUrl, 'POST', dpopKey),
          { log: false },
        )
        .then(dpop =>
          cy.request<{ access_token: string }>({
            url: tokenUrl,
            method: 'POST',
            headers: {
              // The header needs to be in base64 encoding.
              authorization: `Basic ${btoa(
                `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`,
              )}`,
              'content-type': 'application/x-www-form-urlencoded',
              dpop,
            },
            body: 'grant_type=client_credentials&scope=webid',
            log: false,
          }),
        )
        .then(response =>
          cy.wrap(
            { token: response.body.access_token, dpopKey },
            { log: false },
          ),
        ),
    )
}

// TODO fix return type, related to the mess in css-authentication-helpers
export const getAuthenticatedRequest = (user: UserConfig) =>
  getAccountAuthorization(user)
    .then(authorization => getIdAndSecret({ authorization, ...user }))
    .then(getAccessToken)
    .then(({ token, dpopKey }) =>
      cy.wrap<Promise<typeof globalThis.fetch>>(
        buildAuthenticatedFetch(token, {
          dpopKey,
          customFetch: cyFetchWrapper as unknown as typeof globalThis.fetch,
        }),
        { log: false },
      ),
    )
    .then(authFetchWrapper => {
      const authRequest = cyUnwrapFetch(authFetchWrapper)
      return cy.wrap(authRequest, { log: false })
    })

export const getAuthenticatedFetch = v7.getAuthenticatedFetch
