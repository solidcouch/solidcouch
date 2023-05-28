import { dct, solid, vcard } from 'rdf-namespaces'
import { UserConfig } from './css-authentication'

export type CommunityConfig = { community: string; group: string }

export const setupCommunity = ({
  community: communityUri,
}: {
  community: string
}) => {
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
  return cy.wrap({
    community: communityUri,
    group: groupUri,
  } as CommunityConfig)
}

export const setupPod = (
  user: UserConfig,
  community: CommunityConfig,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: unknown,
) => {
  const publicTypeIndexUri = `${user.podUrl}settings/publicTypeIndex.ttl`
  const privateTypeIndexUri = `${user.podUrl}settings/privateTypeIndex.ttl`
  const hospexContainer = `${user.podUrl}hospex/test-community/`
  const hospexDocument = hospexContainer + 'card'
  // create public type index
  cy.authenticatedRequest(user, {
    url: publicTypeIndexUri,
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.
    <> a solid:ListedDocument, solid:TypeIndex.`,
  })
  cy.authenticatedRequest(user, {
    url: publicTypeIndexUri + '.acl',
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `
    @prefix acl: <http://www.w3.org/ns/auth/acl#>.
    @prefix foaf: <http://xmlns.com/foaf/0.1/>.

    <#owner> a acl:Authorization;
      acl:agent <${user.webId}>;
      acl:accessTo <./publicTypeIndex.ttl>;
      acl:mode acl:Read, acl:Write, acl:Control.

    <#public> a acl:Authorization;
      acl:agentClass foaf:Agent;
      acl:accessTo <./publicTypeIndex.ttl>;
      acl:mode acl:Read.
    `,
  })
  cy.authenticatedRequest(user, {
    url: user.webId,
    method: 'PATCH',
    headers: { 'content-type': 'text/n3' },
    body: `
    _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
      <${user.webId}> <${solid.publicTypeIndex}> <${publicTypeIndexUri}>.
    }.`,
  })
  // create private type index
  cy.authenticatedRequest(user, {
    url: privateTypeIndexUri,
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.
    <> a solid:UnlistedDocument, solid:TypeIndex.`,
  })
  cy.authenticatedRequest(user, {
    url: privateTypeIndexUri + '.acl',
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `
    @prefix acl: <http://www.w3.org/ns/auth/acl#>.
    <#owner> a acl:Authorization;
      acl:agent <${user.webId}>;
      acl:accessTo <./privateTypeIndex.ttl>;
      acl:mode acl:Read, acl:Write, acl:Control.`,
  })
  cy.authenticatedRequest(user, {
    url: user.webId,
    method: 'PATCH',
    headers: { 'content-type': 'text/n3' },
    body: `
    _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
      <${user.webId}> <${solid.privateTypeIndex}> <${privateTypeIndexUri}>.
    }.`,
  })
  // create hospex document
  const communityUri = Cypress.env('COMMUNITY')
  cy.authenticatedRequest(user, {
    url: hospexDocument,
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `
    @prefix sioc: <http://rdfs.org/sioc/ns#>.
    @prefix hospex: <http://w3id.org/hospex/ns#>.
    <${user.webId}> sioc:member_of <${communityUri}>;
      hospex:storage <${hospexContainer}>.`,
  })
  cy.authenticatedRequest(user, {
    url: hospexContainer + '.acl',
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `
    @prefix acl: <http://www.w3.org/ns/auth/acl#>.
    <#owner> a acl:Authorization;
      acl:accessTo <${hospexContainer}>;
      acl:agent <${user.webId}>;
      acl:default <${hospexContainer}>;
      acl:mode acl:Read, acl:Write, acl:Control.
    <#read> a acl:Authorization;
      acl:accessTo <${hospexContainer}>;
      acl:agentGroup <${community.group}>;
      acl:default <${hospexContainer}>;
      acl:mode acl:Read.
    `,
  })
  cy.authenticatedRequest(user, {
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
  cy.authenticatedRequest(user, {
    url: community.group,
    method: 'PATCH',
    headers: { 'content-type': 'text/n3' },
    body: `
    _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
      <${community.group}> <${vcard.hasMember}> <${user.webId}>.
    }.`,
  })
}
