/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

// ***********************************************
// For comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import * as uuid from 'uuid'
import { uiLogin, uiLogout } from './authentication'
import { UserConfig, getAuthenticatedRequest } from './css-authentication'
import {
  AccommodationConfig,
  AccommodationData,
  CommunityConfig,
  Profile,
  SetupConfig,
  SkipOptions,
  addAccommodation,
  setProfileData,
  setStorage,
  setupCommunity,
  setupPod,
  stubMailer,
} from './setup'
import { ContactNotification, saveContacts } from './setup/contacts'
import { Conversation, createConversation } from './setup/messages'

declare global {
  namespace Cypress {
    interface Chainable {
      createAccount(options: {
        username: string
        password?: string
        email?: string
      }): Chainable<UserConfig>
      createAccountIfNotExist(options: {
        username: string
        password: string
        email?: string
      }): Chainable<UserConfig>
      createRandomAccount(): Chainable<UserConfig>
      authenticatedRequest(
        user: UserConfig,
        ...args: Parameters<typeof cy.request>
      ): Chainable<Cypress.Response<any>>
      login(user: UserConfig): void
      logout(): void
      setupCommunity(config: { community: string }): Chainable<CommunityConfig>
      setupPod(
        user: UserConfig,
        community: CommunityConfig,
        options?: {
          skip?: SkipOptions[]
          hospexContainerName?: string
        },
      ): Cypress.Chainable<SetupConfig>
      setStorage(user: UserConfig): void
      setProfileData(
        user: UserConfig,
        setup: SetupConfig,
        profile: Profile,
      ): void
      addAccommodation(
        person: Person,
        accommodation: AccommodationData,
      ): Cypress.Chainable<AccommodationConfig>
      /**
       * Create conversation for testing
       * @param conversation.participations - people who are part of the chat
       *   it can be further specified whether to create chat
       *   and whether to reference other participations in it
       * @param conversation.messages - list of messages to create
       *   numeric parameters relate message to conversation.participations elements
       */
      createConversation(conversation: Conversation): void
      /**
       * Create random account, setup pod and set profile data
       * all in one command
       */
      createPerson(
        profile?: Profile,
        community?: CommunityConfig,
      ): Cypress.Chainable<Person>
      /**
       * Save foaf:knows to a person
       * @param person - person to save to
       * @param contacts - list of webIds of the other people
       * @param doc - optional extended profile document to save contacts to
       *   if doc is provided, we'll also link the extended profile document from main profile
       */
      saveContacts(config: {
        person: Person
        contacts: Person[]
        notifications?: (ContactNotification | number)[]
        doc?: string
      }): void
      stubMailer(config: {
        person: Pick<Person, 'webId' | 'inbox'>
        mailer?: string
        integrated?: boolean
        verified?: boolean
      }): void
      testToast(message: string)
      testAndCloseToast(message: string)
    }
  }
}

Cypress.Commands.add('saveContacts', saveContacts)

export type Person = UserConfig & SetupConfig & Profile

Cypress.Commands.add(
  'createPerson',
  (profile?: Profile, community?: CommunityConfig) => {
    cy.get<CommunityConfig>('@community').then(defaultCommunity => {
      profile ??= {
        name: generateRandomString(8),
        description: { en: generateRandomString(20 + Math.random() * 40) },
      }
      cy.createRandomAccount().then(user => {
        cy.setupPod(user, community ?? defaultCommunity).then(setup => {
          cy.setProfileData(user, setup, profile)
          return cy.wrap({ ...user, ...setup, ...profile } as Person, {
            log: false,
          })
        })
      })
    })
  },
)

export const generateRandomString = (length: number): string => {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ          '
  let randomString = ''
  for (let i = 0; i < length; i++) {
    const randomChar = characters.charAt(
      Math.floor(Math.random() * characters.length),
    )
    randomString += randomChar
  }
  return randomString.replace(/\s+/g, ' ').trim()
}

Cypress.Commands.add(
  'createAccount',
  function ({
    username,
    password,
    email,
  }: {
    username: string
    password?: string
    email?: string
  }): Cypress.Chainable<UserConfig> {
    password ??= 'correcthorsebatterystaple'
    email ??= username + '@example.org'
    const config = {
      idp: Cypress.env('cssUrl') + '/',
      podUrl: `${Cypress.env('cssUrl')}/${username}/`,
      webId: `${Cypress.env('cssUrl')}/${username}/profile/card#me`,
      username: username,
      password: password,
      email: email,
    }
    const registerEndpoint = Cypress.env('cssUrl') + '/idp/register/'
    cy.request('POST', registerEndpoint, {
      createWebId: 'on',
      webId: '',
      register: 'on',
      createPod: 'on',
      podName: username,
      email: email,
      password: password,
      confirmPassword: password,
    })

    return cy.wrap(config, { log: false })
  },
)

Cypress.Commands.add(
  'createAccountIfNotExist',
  function ({
    username,
    password,
    email,
  }: {
    username: string
    password: string
    email?: string
  }): Cypress.Chainable<UserConfig> {
    email ??= username + '@example.org'
    const config = {
      idp: Cypress.env('cssUrl') + '/',
      podUrl: `${Cypress.env('cssUrl')}/${username}/`,
      webId: `${Cypress.env('cssUrl')}/${username}/profile/card#me`,
      username: username,
      password: password,
      email: email,
    }
    const registerEndpoint = Cypress.env('cssUrl') + '/idp/register/'
    cy.request({
      method: 'POST',
      url: registerEndpoint,
      body: {
        createWebId: 'on',
        webId: '',
        register: 'on',
        createPod: 'on',
        podName: username,
        email: email,
        password: password,
        confirmPassword: password,
      },
      failOnStatusCode: false,
    })

    return cy.wrap(config, { log: false })
  },
)

Cypress.Commands.add(
  'createRandomAccount',
  function (): Cypress.Chainable<UserConfig> {
    const username = 'test-' + uuid.v4()
    return cy.createAccount({ username })
  },
)

Cypress.Commands.add(
  'authenticatedRequest',
  (user: UserConfig, ...args: Parameters<typeof cy.request>) => {
    return getAuthenticatedRequest(user).then(request => request(...args))
  },
)

Cypress.Commands.add('login', uiLogin)
Cypress.Commands.add('logout', uiLogout)
Cypress.Commands.add('setupCommunity', setupCommunity)
Cypress.Commands.add('setupPod', setupPod)
Cypress.Commands.add('setStorage', setStorage)
Cypress.Commands.add('setProfileData', setProfileData)
Cypress.Commands.add('addAccommodation', addAccommodation)
Cypress.Commands.add('createConversation', createConversation)
Cypress.Commands.add('stubMailer', stubMailer)

Cypress.Commands.add('testToast', (message: string) =>
  cy.contains('div.Toastify__toast', message),
)
Cypress.Commands.add('testAndCloseToast', (message: string) =>
  cy
    .testToast(message)
    .find('button.Toastify__close-button')
    .click({ force: true }),
)

/**
Some code is copied from solidcryptpad repository
https://github.com/solidcryptpad/solidcryptpad/blob/74f93fee06fcb93b454f6004863647ef11e9c24f/cypress/support/commands.ts

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
