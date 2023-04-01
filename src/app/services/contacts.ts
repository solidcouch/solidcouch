import { Contact, URI } from 'types'

import { QueryEngine as TraversalQueryEngine } from '@comunica/query-sparql-link-traversal'
import { fullFetch } from 'utils/helpers'
import { foaf } from 'utils/rdf-namespaces'
import { query } from './comunicaApi'
import { bindings2data } from './helpers'

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

  // check which of those contacts say they know the person
  // TODO later check which of the contacts are members of the community
  // collect the results:
  // if only one direction exists, show contact as unconfirmed
  return data.map(({ contact, relationship }) => ({
    webId: contact as URI,
    status: relationship ? 'confirmed' : 'request_sent',
  }))
}
