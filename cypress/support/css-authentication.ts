import {
  buildAuthenticatedFetch,
  createDpopHeader,
  generateDpopKeyPair,
  KeyPair,
} from '@inrupt/solid-client-authn-core'
import _ from 'lodash'
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
    .request(`${Cypress.env('CSS_URL')}/.account/`)
    .then(response =>
      cy.request({
        url: response.body.controls.password.login,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: {
          email: user.email,
          password: user.password,
        },
      }),
    )
    .then(response =>
      cy.wrap(response.body.authorization as string, { log: false }),
    )

const getIdAndSecret = ({
  webId,
  authorization,
}: {
  webId: string
  authorization: string
}) =>
  cy
    .request(`${Cypress.env('CSS_URL')}/.account/`, {
      headers: { authorization: `CSS-Account-Token ${authorization}` },
    })
    .then(controlResponse => {
      return cy
        .request({
          url: controlResponse.body.controls.account.clientCredentials,
          method: 'POST',
          headers: {
            authorization: `CSS-Account-Token ${authorization}`,
            'content-type': 'application/json',
          },
          // The name field will be used when generating the ID of your token.
          // The WebID field determines which WebID you will identify as when using the token.
          // Only WebIDs linked to your account can be used.
          body: {
            name: 'cypress-login-token',
            webId,
          },
        })
        .then(response =>
          cy
            .request({
              url: controlResponse.body.controls.account.logout,
              method: 'POST',
            })
            .then(() =>
              cy.wrap(
                _.pick(response.body, 'id', 'secret', 'resource') as {
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
  return cy
    .wrap(generateDpopKeyPair(), { log: false })
    .then((dpopKey: KeyPair) =>
      cy
        .wrap(createDpopHeader(tokenUrl, 'POST', dpopKey), { log: false })
        .then(dpop =>
          cy.request({
            url: tokenUrl,
            method: 'POST',
            headers: {
              // The header needs to be in base64 encoding.
              authorization: `Basic ${Buffer.from(
                `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`,
              ).toString('base64')}`,
              'content-type': 'application/x-www-form-urlencoded',
              dpop,
            },
            body: 'grant_type=client_credentials&scope=webid',
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
        buildAuthenticatedFetch(
          // @ts-ignore
          cyFetchWrapper,
          token,
          { dpopKey },
        ),
        { log: false },
      ),
    )
    .then(authFetchWrapper => {
      const authRequest = cyUnwrapFetch(authFetchWrapper)
      return cy.wrap(authRequest, { log: false })
    })
