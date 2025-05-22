import dayjs from 'dayjs'
import { solid } from 'rdf-namespaces'
import { v4 as uuidv4 } from 'uuid'
import { UserConfig } from '../css-authentication'
import { SetupConfig } from '../setup'

type Message = {
  message: string
  created: Date
  chat: number
  notifications: number[]
}

type Participation = {
  person: UserConfig & SetupConfig
  setupChat?: boolean
  skipReferences?: number[]
}

type Conversation = {
  participations: Participation[]
  messages: Message[]
}

/**
 * Set up a conversation
 */
export const createConversation = (conversation: Conversation) => {
  // create chat of each participant
  // some participants may not have chat set up
  // some participants may not reference some other chats
  // TODO some participants may not reference other participants at all
  // and they will definitely not reference non-existent chats
  const chatConfigs = conversation.participations
    .map(({ person, setupChat = true, skipReferences = [] }) => ({
      container: `${person.hospexContainer}messages/${uuidv4()}/`,
      get chat() {
        return `${this.container}index.ttl#this`
      },
      person,
      setupChat,
      skipReferences,
    }))
    .map(({ person, container, setupChat, chat }, i, all) => {
      const participations = getParticipations(i, all)
      return {
        creator: person,
        container,
        chat,
        participations,
        skip: !setupChat,
      }
    })

  chatConfigs.forEach(config => {
    if (!config.skip) createChat(config)
  })

  // create messages in their chats
  for (const message of conversation.messages) {
    const { creator, container, chat } = chatConfigs[message.chat]!
    const uri = saveMessage({ ...message, creator, container, chat })
    for (const n of message.notifications) {
      const inbox = chatConfigs[n]!.creator.inbox
      saveNotification(inbox, { ...message, id: uri, creator, container, chat })
    }

    // create notifications for some messages and participants
  }

  return cy.wrap(chatConfigs)
}

const saveMessage = (message: {
  creator: UserConfig
  created: Date
  container: string
  chat: string
  message: string
}) => {
  const uri =
    message.container +
    dayjs(message.created).format('YYYY/MM/DD') +
    '/chat.ttl#msg-' +
    uuidv4()
  cy.authenticatedRequest(message.creator, {
    method: 'PATCH',
    url: uri,
    headers: { 'content-type': 'text/n3' },
    body: `
@prefix dct: <http://purl.org/dc/terms/>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix sioc: <http://rdfs.org/sioc/ns#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
  <${uri}>
      dct:created "${message.created.toISOString()}"^^xsd:dateTime;
      sioc:content "${message.message}";
      foaf:maker <${message.creator.webId}>.
  <${message.chat}> wf:message <${uri}>.
}.`,
  })
  return uri
}

const saveNotification = (
  inbox: string,
  message: {
    id: string
    creator: UserConfig
    created: Date
    container: string
    chat: string
    message: string
  },
) => {
  cy.authenticatedRequest(message.creator, {
    method: 'POST',
    url: inbox,
    headers: { 'content-type': 'text/turtle' },
    body: `
    @prefix as: <https://www.w3.org/ns/activitystreams#>.
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
    <>
        a as:Add;
        as:actor <${message.creator.webId}>;
    as:context <https://www.pod-chat.com/LongChatMessage>;
    as:object <${message.id}>;
    as:target <${message.chat}>;
    as:updated "${message.created.toISOString()}"^^xsd:dateTime.
    `,
  })
}

const getParticipations = (
  current: number,
  participations: (Participation & { container: string })[],
): ChatConfig['participations'] => {
  // if chat is not set up, return empty array
  if (!participations[current]?.setupChat) return []
  const chatParticipations = participations.flatMap((p, i, all) =>
    i === current
      ? []
      : {
          person: p.person.webId,
          chat: all[current]?.skipReferences?.includes(i)
            ? undefined
            : p.container + 'index.ttl#this',
        },
  )
  return chatParticipations
}

const createChat = (config: ChatConfig) => {
  // create chat
  cy.authenticatedRequest(config.creator, {
    url: config.container + 'index.ttl',
    method: 'PUT',
    body: getChatTurtle(config),
    headers: { 'content-type': 'text/turtle' },
  })
  // create chat acl
  cy.authenticatedRequest(config.creator, {
    url: config.container + '.acl',
    method: 'PUT',
    body: getChatAclTurtle(config),
    headers: { 'content-type': 'text/turtle' },
  })
  // and save reference to chat in private type index
  cy.authenticatedRequest(config.creator, {
    url: config.creator.privateTypeIndex,
    method: 'PATCH',
    headers: { 'content-type': 'text/n3' },
    body: `
    @prefix dct: <http://purl.org/dc/terms/>.
    @prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.

    _:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
        <#messages>
            a solid:TypeRegistration;
            solid:forClass meeting:LongChat;
            solid:instance <${config.chat}>.
    }.`,
  })
}

type ChatConfig = {
  chat: string
  container: string
  creator: UserConfig & SetupConfig
  created?: Date
  // don't include creator in participations
  participations: {
    person: string
    chat?: string
  }[]
}

const getChatTurtle = ({
  creator,
  created = new Date(),
  participations,
}: ChatConfig) => {
  const time = created.toISOString()
  const allParticipations = [...participations, { person: creator.webId }].map(
    participation => ({ ...participation, id: uuidv4() }),
  )
  return `
@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.
@prefix dc: <http://purl.org/dc/elements/1.1/>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix wf: <http://www.w3.org/2005/01/wf/flow#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

<#this>
    a meeting:LongChat;
    dc:author <${creator.webId}>;
    dct:creator <${creator.webId}>;
    dc:created "${time}"^^xsd:dateTime;
    dct:created "${time}"^^xsd:dateTime;
    dc:title "Hospex chat channel";
    dct:title "Hospex chat channel";
    wf:participation
        ${allParticipations.map(({ id }) => `<#${id}>`).join(',\n        ')};
    ui:sharedPreferences <#SharedPreferences>.
${allParticipations
  .map(participation =>
    getParticipationTurtle({ ...participation, created: time }),
  )
  .join('')}`
}

const getParticipationTurtle = ({
  id,
  person,
  chat,
  created,
}: {
  id: string
  person: string
  chat?: string
  created: string
}) => `
<#${id}>
  ${chat ? `dct:references <${chat}>;` : ''}
  cal:dtstart "${created}"^^xsd:dateTime;
  wf:participant <${person}>.
`

const getChatAclTurtle = ({ container, creator, participations }: ChatConfig) =>
  `
@prefix acl: <http://www.w3.org/ns/auth/acl#>.

<#ControlReadWrite>
    a acl:Authorization;
    acl:accessTo <${container}>;
    acl:agent <${creator.webId}>;
    acl:default <${container}>;
    acl:mode acl:Control, acl:Read, acl:Write.
<#Read>
    a acl:Authorization;
    acl:accessTo <${container}>;
    acl:agent ${participations.map(({ person }) => `<${person}>`).join(', ')};
    acl:default <${container}>;
    acl:mode acl:Read.
`
