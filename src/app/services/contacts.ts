import { QueryEngine } from '@comunica/query-sparql'
import { QueryEngine as TraversalQueryEngine } from '@comunica/query-sparql-link-traversal'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { DataFactory } from 'n3'
import { Contact, URI } from 'types'
import { fullFetch } from 'utils/helpers'
import { acl, as, foaf, ldp, rdf, xsd } from 'utils/rdf-namespaces'
import { query } from './comunicaApi'
import { bindings2data } from './helpers'
import { getHospexContainer, getInbox } from './messages'

const { namedNode, literal, quad, blankNode } = DataFactory
const traversalEngine = new TraversalQueryEngine()

export const readContacts = async (webId: URI): Promise<Contact[]> => {
  const myEngine = new TraversalQueryEngine()
  // read contact requests from inbox
  /**
   * TODO
   */
  // read contacts of the person (foaf:knows)
  const contactsQuery = query`
  SELECT ?contact ?relationship
  WHERE {
    <${webId}> <${foaf.knows}> ?contact .
    OPTIONAL {
      ?contact <${foaf.knows}> <${webId}> .
      BIND(<${foaf.knows}> AS ?relationship)
    }
  }`
  const bindings = await myEngine.queryBindings(contactsQuery, {
    sources: [webId],
    lenient: true,
    fetch: fullFetch,
  })

  const data = await bindings2data(bindings)

  const contactInvitations = await readContactsFromInbox(webId)

  // check which of those contacts say they know the person
  // TODO later check which of the contacts are members of the community
  // collect the results:
  // if only one direction exists, show contact as unconfirmed
  return data
    .map(
      ({ contact, relationship }) =>
        ({
          webId: contact,
          status: relationship ? 'confirmed' : 'request_sent',
        } as Contact),
    )
    .concat(contactInvitations)
}

const readContactsFromInbox = async (webId: string): Promise<Contact[]> => {
  const traversalEngine = new TraversalQueryEngine()
  await traversalEngine.invalidateHttpCache()
  const readInboxQuery = query`SELECT * WHERE {
    <${webId}> <${ldp.inbox}> ?inbox.
    ?inbox <${ldp.contains}> ?notification.
    ?notification
        <${rdf.type}> <${as.Invite}>;
        <${as.actor}> ?actor;
        <${as.content}> ?invitation;
        <${as.object}> ?object.
    ?object
        <${rdf.type}> <${as.Relationship}>;
        <${as.subject}> ?actor;
        <${as.relationship}> <${foaf.knows}>;
        <${as.object}> <${webId}>.
  }`
  const bindingsStream = await traversalEngine.queryBindings(readInboxQuery, {
    sources: [webId],
    lenient: true,
    fetch: fullFetch,
  })
  const data = await bindings2data(bindingsStream)

  return data.map(
    ({ notification, invitation, actor }) =>
      ({
        webId: actor,
        status: 'request_received',
        invitation,
        notification,
      } as Contact),
  )
}

export const createContact = async ({
  me,
  other,
  invitation,
}: {
  me: URI
  other: URI
  invitation: string
}) => {
  // add contact to my profile document
  const addContactQuery = query`INSERT DATA {
    ${[quad(namedNode(me), namedNode(foaf.knows), namedNode(other))]}
  }`
  const simpleEngine = new QueryEngine()
  await simpleEngine.queryVoid(addContactQuery, {
    sources: [me],
    destination: { type: 'patchSparqlUpdate', value: me },
    fetch: fullFetch,
  })

  // send contact notification to other person's inbox
  // save notification to other person's inbox
  const inbox = await getInbox(other)
  const node = namedNode('')
  const objectNode = blankNode()
  const dateLiteral = literal(new Date().toISOString(), namedNode(xsd.dateTime))
  const notificationQuads = [
    quad(node, namedNode(rdf.type), namedNode(as.Invite)),
    quad(node, namedNode(as.actor), namedNode(me)),
    quad(node, namedNode(as.content), literal(invitation)),
    quad(node, namedNode(as.object), objectNode),
    quad(node, namedNode(as.target), namedNode(me)),
    quad(objectNode, namedNode(rdf.type), namedNode(as.Relationship)),
    quad(objectNode, namedNode(as.subject), namedNode(me)),
    quad(objectNode, namedNode(as.relationship), namedNode(foaf.knows)),
    quad(objectNode, namedNode(as.object), namedNode(other)),
    quad(node, namedNode(as.updated), dateLiteral),
  ]

  const notificationQuery = query`${notificationQuads}`

  await fetch(inbox, {
    method: 'POST',
    body: notificationQuery,
    headers: { 'content-type': 'text/turtle' },
  })

  await traversalEngine.invalidateHttpCache()
  await grantHospexAccess({ me, accessFor: other })
}

export const confirmContact = async ({
  me,
  other,
  notification,
}: {
  me: URI
  other: URI
  notification: URI
}) => {
  // add contact to my profile document
  const addContactQuery = query`INSERT DATA {
    ${[quad(namedNode(me), namedNode(foaf.knows), namedNode(other))]}
  }`
  const simpleEngine = new QueryEngine()
  await simpleEngine.queryVoid(addContactQuery, {
    sources: [me],
    destination: { type: 'patchSparqlUpdate', value: me },
    fetch: fullFetch,
  })

  await fetch(notification, { method: 'DELETE' })
  await traversalEngine.invalidateHttpCache()
  await grantHospexAccess({ me, accessFor: other })
}

export const ignoreContact = async ({
  notification,
}: {
  notification: URI
}) => {
  await fetch(notification, { method: 'DELETE' })
  await traversalEngine.invalidateHttpCache()
}

/**
 * Grant hospex folder access to a user
 */
export const grantHospexAccess = async ({
  me,
  accessFor,
}: {
  me: URI
  accessFor: URI
}) => {
  // get my hospex container
  const hospexContainer = await getHospexContainer(me)
  const hospexAcl = hospexContainer + '.acl'

  // give the other user access to my hospex container
  const personAccessQuery = query`
  INSERT {
    ?authorization <${acl.agent}> <${accessFor}>.
  } WHERE {
    ?authorization
        <${rdf.type}> <${acl.Authorization}>;
        <${acl.accessTo}> <${hospexContainer}>;
        <${acl.mode}> <${acl.Read}>.
    FILTER NOT EXISTS {
      ?authorization <${acl.mode}> <${acl.Control}>.
    }
    FILTER NOT EXISTS {
      ?authorization <${acl.mode}> <${acl.Write}>.
    }
    FILTER NOT EXISTS {
      ?authorization <${acl.mode}> <${acl.Append}>.
    }
  }
  `
  const simpleEngine = new QueryEngine()
  await simpleEngine.queryVoid(personAccessQuery, {
    sources: [hospexAcl],
    destination: { type: 'patchSparqlUpdate', value: hospexAcl },
    fetch,
  })
}
