import {
  createDpopHeader,
  generateDpopKeyPair,
  KeyPair,
} from '@inrupt/solid-client-authn-core'
import pick from 'lodash/pick'
import { buildAuthenticatedFetch } from './buildAuthenticatedFetch'
import { cyFetchWrapper, cyUnwrapFetch } from './css-authentication-helpers'

export interface UserConfig {
  idp: string
  podUrl: string
  webId: string
  username: string
  password: string
  email: string
}

const getAccountAuthorization = (user: UserConfig) =>
  cy
    .request({ url: `${Cypress.env('CSS_URL')}/.account/`, log: false })
    .then(response =>
      cy.request({
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
    .then(response =>
      cy.wrap(response.body.authorization as string, { log: false }),
    )

const getControls = (authorization: string) =>
  cy
    .request<{
      controls: {
        account: { clientCredentials: string; logout: string }
      }
    }>({
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
      .request({
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
          .request({
            url: controls.account.logout,
            method: 'POST',
            log: false,
          })
          .then(() =>
            cy.wrap(
              pick(response.body, 'id', 'secret', 'resource') as {
                id: string
                secret: string
              },
              { log: false },
            ),
          ),
      )
  })

const getAccessToken = ({ id, secret }: { id: string; secret: string }) => {
  const tokenUrl = `${Cypress.env('CSS_URL')}/.oidc/token`
  return cy.wrap(generateDpopKeyPair(), { log: false }).then(dpopKey =>
    cy
      .wrap(createDpopHeader(tokenUrl, 'POST', dpopKey as KeyPair), {
        log: false,
      })
      .then(dpop =>
        cy.request({
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
          { token: response.body.access_token as string, dpopKey },
          { log: false },
        ),
      ),
  )
}

export const getAuthenticatedRequest = (user: UserConfig) =>
  getAccountAuthorization(user)
    .then(authorization => getIdAndSecret({ authorization, ...user }))
    .then(getAccessToken)
    .then(({ token, dpopKey }) =>
      cy.wrap(
        buildAuthenticatedFetch(token, {
          dpopKey: dpopKey as KeyPair,
          customFetch: cyFetchWrapper as unknown as typeof globalThis.fetch,
        }),
        {
          log: false,
        },
      ),
    )
    .then(authFetchWrapper => {
      const authRequest = cyUnwrapFetch(authFetchWrapper)
      return cy.wrap(authRequest, { log: false })
    })
