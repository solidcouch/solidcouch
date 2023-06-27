import { Person, generateRandomString } from '../commands'

export type ContactNotification = {
  person: number
  message?: string
  date?: Date
}

export const saveContacts = ({
  person,
  contacts,
  notifications = [],
  doc,
}: {
  person: Person
  contacts: Person[]
  notifications?: (ContactNotification | number)[]
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
          ${contacts.map(({ webId }) => `<${webId}>`).join(',\n          ')}.
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

  for (const notification of notifications) {
    const contactIndex =
      typeof notification === 'number' ? notification : notification.person
    const rest = typeof notification === 'number' ? {} : notification
    sendContactNotification({
      ...rest,
      from: person,
      to: contacts[contactIndex],
    })
  }
}

const sendContactNotification = (config: {
  from: Person
  to: Person
  message?: string
  date?: Date
}) => {
  const message = config.message ?? generateRandomString(140)
  const date = config.date ?? new Date()
  cy.authenticatedRequest(config.from, {
    url: config.to.inbox,
    method: 'POST',
    headers: { 'content-type': 'text/turtle' },
    body: `
    @prefix as: <https://www.w3.org/ns/activitystreams#>.
    @prefix foaf: <http://xmlns.com/foaf/0.1/>.
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

    <> a as:Invite ;
      as:actor <${config.from.webId}> ;
      as:content "${message}" ;
      as:object _:n3-0 ;
      as:target <${config.to.webId}> ;
      as:updated "${date.toISOString()}"^^xsd:dateTime .
    _:n3-0 a as:Relationship ;
        as:subject <${config.from.webId}> ;
        as:relationship foaf:knows ;
        as:object <${config.to.webId}> .\n`,
  })
  return { ...config, message, date }
}
