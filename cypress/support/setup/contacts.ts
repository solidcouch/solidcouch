import { UserConfig } from '../css-authentication'

export const saveContacts = ({
  person,
  contacts,
  doc,
}: {
  person: UserConfig
  contacts: string[]
  doc?: string
}) => {
  if (contacts.length === 0) return

  cy.authenticatedRequest(person, {
    url: doc ?? person.webId,
    method: 'PATCH',
    headers: { 'content-type': 'text/n3' },
    body: `
    @prefix foaf: <http://xmlns.com/foaf/0.1/>.
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.
    _:mutation a solid:InsertDeletePatch;
      solid:inserts {
        <${person.webId}> foaf:knows
          ${contacts.map(c => `<${c}>`).join(',\n          ')}.
      }.
    `,
  })

  if (doc && doc !== person.webId) {
    cy.authenticatedRequest(person, {
      url: person.webId,
      method: 'PATCH',
      headers: { 'content-type': 'text/n3' },
      body: `
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
      @prefix solid: <http://www.w3.org/ns/solid/terms#>.
      _:mutation a solid:InsertDeletePatch;
        solid:inserts { <${person.webId}> rdfs:seeAlso <${doc}>. }.
      `,
    })
  }
}
