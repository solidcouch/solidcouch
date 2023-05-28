import { dct, solid, vcard } from 'rdf-namespaces'
import { UserConfig } from '../support/css-authentication'

const preparePod = () => {
  cy.createRandomAccount().as('user1')
  setupCommunity()
}

const setupCommunity = () => {
  const communityUri: string = Cypress.env('COMMUNITY')
  const url = new URL(communityUri)
  const username = url.pathname.split('/')[1]
  url.hash = ''
  const communityDoc = url.toString()
  url.pathname += '.acl'
  const communityAcl = url.toString()
  url.pathname = `/${username}/`
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
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#>.
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
  cy.wrap({
    community: communityUri,
    group: groupUri,
  }).as('community')
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

const setupPod = () => {
  cy.get<{ community: string; group: string }>('@community').then(community => {
    cy.get<UserConfig>('@user1').then(user1 => {
      const publicTypeIndexUri = `${user1.podUrl}settings/publicTypeIndex.ttl`
      const privateTypeIndexUri = `${user1.podUrl}settings/privateTypeIndex.ttl`
      const hospexContainer = `${user1.podUrl}hospex/test-community/`
      const hospexDocument = hospexContainer + 'card'
      // create public type index
      cy.authenticatedRequest(user1, {
        url: publicTypeIndexUri,
        method: 'PUT',
        headers: { 'content-type': 'text/turtle' },
        body: `
        @prefix solid: <http://www.w3.org/ns/solid/terms#>.
        <> a solid:ListedDocument, solid:TypeIndex.`,
      })
      cy.authenticatedRequest(user1, {
        url: publicTypeIndexUri + '.acl',
        method: 'PUT',
        headers: { 'content-type': 'text/turtle' },
        body: `
        @prefix acl: <http://www.w3.org/ns/auth/acl#>.
        @prefix foaf: <http://xmlns.com/foaf/0.1/>.

        <#owner> a acl:Authorization;
          acl:agent <${user1.webId}>;
          acl:accessTo <./publicTypeIndex.ttl>;
          acl:mode acl:Read, acl:Write, acl:Control.

        <#public> a acl:Authorization;
          acl:agentClass foaf:Agent;
          acl:accessTo <./publicTypeIndex.ttl>;
          acl:mode acl:Read.
        `,
      })
      cy.authenticatedRequest(user1, {
        url: user1.webId,
        method: 'PATCH',
        headers: { 'content-type': 'text/n3' },
        body: `
        _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
          <${user1.webId}> <${solid.publicTypeIndex}> <${publicTypeIndexUri}>.
        }.`,
      })
      // create private type index
      cy.authenticatedRequest(user1, {
        url: privateTypeIndexUri,
        method: 'PUT',
        headers: { 'content-type': 'text/turtle' },
        body: `
        @prefix solid: <http://www.w3.org/ns/solid/terms#>.
        <> a solid:UnlistedDocument, solid:TypeIndex.`,
      })
      cy.authenticatedRequest(user1, {
        url: privateTypeIndexUri + '.acl',
        method: 'PUT',
        headers: { 'content-type': 'text/turtle' },
        body: `
        @prefix acl: <http://www.w3.org/ns/auth/acl#>.
        <#owner> a acl:Authorization;
          acl:agent <${user1.webId}>;
          acl:accessTo <./privateTypeIndex.ttl>;
          acl:mode acl:Read, acl:Write, acl:Control.`,
      })
      cy.authenticatedRequest(user1, {
        url: user1.webId,
        method: 'PATCH',
        headers: { 'content-type': 'text/n3' },
        body: `
        _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
          <${user1.webId}> <${solid.privateTypeIndex}> <${privateTypeIndexUri}>.
        }.`,
      })
      // create hospex document
      const communityUri = Cypress.env('COMMUNITY')
      cy.authenticatedRequest(user1, {
        url: hospexDocument,
        method: 'PUT',
        headers: { 'content-type': 'text/turtle' },
        body: `
        @prefix sioc: <http://rdfs.org/sioc/ns#>.
        @prefix hospex: <http://w3id.org/hospex/ns#>.
        <${user1.webId}> sioc:member_of <${communityUri}>;
          hospex:storage <${hospexContainer}>.`,
      })
      cy.authenticatedRequest(user1, {
        url: hospexContainer + '.acl',
        method: 'PUT',
        headers: { 'content-type': 'text/turtle' },
        body: `
        @prefix acl: <http://www.w3.org/ns/auth/acl#>.
        <#owner> a acl:Authorization;
          acl:accessTo <${hospexContainer}>;
          acl:agent <${user1.webId}>;
          acl:default <${hospexContainer}>;
          acl:mode acl:Read, acl:Write, acl:Control.
        <#read> a acl:Authorization;
          acl:accessTo <${hospexContainer}>;
          acl:agentGroup <${community.group}>;
          acl:default <${hospexContainer}>;
          acl:mode acl:Read.
        `,
      })
      cy.authenticatedRequest(user1, {
        url: publicTypeIndexUri,
        method: 'PATCH',
        headers: { 'content-type': 'text/n3' },
        body: `
        @prefix hospex: <http://w3id.org/hospex/ns#>.
        _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
          <> <${dct.references}> <#hospex>.
          <#hospex> a <${solid.TypeRegistration}>;
          <${solid.forClass}> hospex:PersonalHospexDocument;
          <${solid.instance}> <${hospexDocument}>.
        }.`,
      })

      // join community
      cy.authenticatedRequest(user1, {
        url: community.group,
        method: 'PATCH',
        headers: { 'content-type': 'text/n3' },
        body: `
        _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
          <${community.group}> <${vcard.hasMember}> <${user1.webId}>.
        }.`,
      })
      // // specify pim:storage
      // cy.authenticatedRequest(user1, {
      //   url: user1.webId,
      //   method: 'PATCH',
      //   body: `_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
      //     <${user1.webId}> <${space.storage}> <${user1.podUrl}>.
      //   }.`,
      //   headers: { 'content-type': 'text/n3' },
      // })
    })
  })
}

const resetPod = () => {}

describe('Setup Solid pod', () => {
  beforeEach(resetPod)
  beforeEach(preparePod)

  context('everything is set up', () => {
    beforeEach(setupPod)
    it('should skip the setup step', () => {
      signIn()
      cy.contains('a', 'travel')
      cy.contains('a', 'host')
    })
  })

  context('pim:storage is missing', () => {
    it(
      'should setup the pod just fine (find storage by checking parent folders)',
    )
  })

  context('public type index is missing', () => {
    it('should create public type index with correct ACL')
  })

  context('private type index is missing', () => {
    it('should create private type index with correct ACL')
  })

  context('community not joined', () => {
    it('should join the community')
  })

  context('personal hospex document for this community does not exist', () => {
    it('should create personal hospex document for this community')
  })

  context('everything is missing', () => {
    it('should set up everything')
  })
})
