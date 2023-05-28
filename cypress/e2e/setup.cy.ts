import { solid, space } from 'rdf-namespaces'
import { UserConfig } from '../support/css-authentication'

const preparePod = () => {
  cy.createRandomAccount().then(user1 => {
    cy.wrap(user1).as('user1')
    cy.authenticatedRequest(user1, {
      url: user1.webId,
      method: 'PATCH',
      body: `_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
        <${user1.webId}> <${space.storage}> <${user1.podUrl}>.
      }.`,
      headers: { 'content-type': 'text/n3' },
    })
  })
  setupCommunity()
}

const setupCommunity = () => {
  const communityUri = Cypress.env('COMMUNITY')
  const url = new URL(communityUri)
  const username = url.pathname.split('/')[1]
  url.hash = ''
  const communityDoc = url.toString()
  url.pathname += '.acl'
  const communityAcl = url.toString()
  url.pathname = `/${username}/`
  const podUri = url.toString()
  url.pathname += 'group'
  url.hash = 'us'
  const groupUri = url.toString()
  url.hash = ''
  const groupDoc = url.toString()
  url.pathname += '.acl'
  const groupAcl = url.toString()
  // currently, we can create account only once
  // because we have no way of deleting accounts before new tests
  cy.createAccountIfNotExist({
    username,
    password: 'CorrectHorseBatteryStaple',
  }).as('communityUser')
  cy.get<UserConfig>('@communityUser').then(user => {
    cy.authenticatedRequest(user, {
      url: groupAcl,
      method: 'DELETE',
      failOnStatusCode: false,
    })
    cy.authenticatedRequest(user, {
      url: communityAcl,
      method: 'DELETE',
      failOnStatusCode: false,
    })
    cy.authenticatedRequest(user, {
      url: groupDoc,
      method: 'DELETE',
      failOnStatusCode: false,
    })
    cy.authenticatedRequest(user, {
      url: communityDoc,
      method: 'DELETE',
      failOnStatusCode: false,
    })
    cy.authenticatedRequest(user, {
      url: communityDoc,
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: `
      @prefix hospex: <http://w3id.org/hospex/ns#>.
      @prefix sioc: <http://rdfs.org/sioc/ns#>.
      <${communityUri}> a hospex:Community, sioc:Community;
        sioc:name "Test Community"@en;
        sioc:about "Development community for sleepy-bike-solid"@en;
        sioc:has_usergroup <${groupUri}>.`,
    })
    cy.authenticatedRequest(user, {
      url: groupDoc,
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: `
      @prefix sioc: <http://rdfs.org/sioc/ns#>.
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#>
      <${groupUri}> a sioc:Usergroup, vcard:Group;
      sioc:usergroup_of <${communityUri}>.`,
    })
    cy.authenticatedRequest(user, {
      url: communityAcl,
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: `
      @prefix acl: <http://www.w3.org/ns/auth/acl#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/>.
      <#Control> a acl:Authorization;
        acl:agent <${user.webId}>;
        acl:accessTo <${communityDoc}>;
        acl:mode acl:Read, acl:Write, acl:Control.
      <#Read> a acl:Authorization;
        acl:accessTo <${communityDoc}>;
        acl:mode acl:Read;
        acl:agentClass foaf:Agent.`,
    })
    cy.authenticatedRequest(user, {
      url: groupAcl,
      method: 'PUT',
      headers: { 'content-type': 'text/turtle' },
      body: `
      @prefix acl: <http://www.w3.org/ns/auth/acl#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/>.
      <#Control> a acl:Authorization;
        acl:agent <${user.webId}>;
        acl:accessTo <${groupDoc}>;
        acl:mode acl:Read, acl:Write, acl:Control.
      <#Read> a acl:Authorization;
        acl:accessTo <${groupDoc}>;
        acl:mode acl:Read;
        acl:agentClass foaf:Agent;
        acl:agentGroup <${groupUri}>.
      <#Append> a acl:Authorization;
        acl:accessTo <${groupDoc}>;
        acl:mode acl:Append;
        acl:agentClass acl:AuthenticatedAgent.
        `,
    })
  })
}

const signIn = () => {
  cy.visit('/')
  cy.contains('Sign in').click()
  cy.get<UserConfig>('@user1').then(user1 => {
    cy.get('input[name=webIdOrIssuer]').type(`${user1.idp}{enter}`)
    cy.origin(user1.idp, { args: { user1 } }, ({ user1 }) => {
      cy.get('input[name=email]').type(user1.email)
      cy.get('input[name=password]').type(`${user1.password}{enter}`)
      cy.get('button#authorize').click()
    })
  })
}

const resetPod = () => {}

describe('Setup Solid pod', () => {
  beforeEach(resetPod)
  beforeEach(preparePod)
  beforeEach(signIn)
  it('should set up the pod', () => {
    cy.log(Cypress.env('COMMUNITY'))
    cy.contains('button', 'Continue!').click()
  })
})
