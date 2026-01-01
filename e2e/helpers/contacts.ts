import { type Person } from './account'
import { generateRandomString } from './helpers'

type ContactNotification = {
  person: Person
  message?: string
  date?: Date
}

export const saveContacts = async ({
  person,
  contacts,
  notifications = [],
  doc,
}: {
  person: Person
  contacts: Person[]
  notifications?: (ContactNotification | Person)[]
  doc?: string
}) => {
  if (contacts.length === 0) return

  await person.account.authFetch(doc ?? person.account.webId, {
    method: 'PATCH',
    headers: { 'content-type': 'text/n3' },
    body: `
    @prefix foaf: <http://xmlns.com/foaf/0.1/>.
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.
    _:mutation a solid:InsertDeletePatch;
      solid:inserts {
        <${person.account.webId}> foaf:knows
          ${contacts.map(c => `<${c.account.webId}>`).join(',\n          ')}.
      }.
    `,
  })

  if (doc && doc !== person.account.webId) {
    await person.account.authFetch(person.account.webId, {
      method: 'PATCH',
      headers: { 'content-type': 'text/n3' },
      body: `
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
      @prefix solid: <http://www.w3.org/ns/solid/terms#>.
      _:mutation a solid:InsertDeletePatch;
        solid:inserts { <${person.account.webId}> rdfs:seeAlso <${doc}>. }.
      `,
    })
  }

  for (const notification of notifications) {
    const rest: ContactNotification =
      'person' in notification ? notification : { person: notification }
    await sendContactNotification({
      ...rest,
      from: person,
      to: 'person' in notification ? notification.person : notification,
    })
  }
}

const sendContactNotification = async (config: {
  from: Person
  to: Person
  message?: string
  date?: Date
}) => {
  const message = config.message ?? generateRandomString(140)
  const date = config.date ?? new Date()
  await config.from.account.authFetch(config.to.pod.inbox, {
    method: 'POST',
    headers: { 'content-type': 'text/turtle' },
    body: `
    @prefix as: <https://www.w3.org/ns/activitystreams#>.
    @prefix foaf: <http://xmlns.com/foaf/0.1/>.
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

    <> a as:Invite ;
      as:actor <${config.from.account.webId}> ;
      as:content "${message}" ;
      as:object _:n3-0 ;
      as:target <${config.to.account.webId}> ;
      as:updated "${date.toISOString()}"^^xsd:dateTime .
    _:n3-0 a as:Relationship ;
        as:subject <${config.from.account.webId}> ;
        as:relationship foaf:knows ;
        as:object <${config.to.account.webId}> .\n`,
  })
  return { ...config, message, date }
}
