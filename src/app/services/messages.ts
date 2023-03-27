import { QueryEngine } from '@comunica/query-sparql'
import { QueryEngine as TraversalQueryEngine } from '@comunica/query-sparql-link-traversal'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { mergeWith } from 'lodash'
import { DataFactory, Quad } from 'n3'
import { as, dct, foaf, ldp, rdf, sioc, solid, wf } from 'rdf-namespaces'
import { Message, Thread, URI } from 'types'
import { fullFetch, getContainer } from 'utils/helpers'
import * as uuid from 'uuid'
import { query } from './comunicaApi'
import { bindings2data } from './helpers'

const traversalEngine = new TraversalQueryEngine()
const simpleEngine = new QueryEngine()
const { namedNode, literal, quad } = DataFactory

export const readThreads = async ({ me }: { me: URI }): Promise<Thread[]> => {
  // read private type index and find long chats
  // TODO read also public type index
  // meeting:LongChat doesn't exist!
  // wf:participation doesn't exist!
  // for some reason, this query gets stuck when we try to include participants
  // (?participation wf:participant ?participant.)
  // so we have to fetch participants separately
  const readIndexesQuery = query`SELECT * WHERE {
    <${me}> <${solid.privateTypeIndex}> ?index.
    ?registration
        <${solid.forClass}> <http://www.w3.org/ns/pim/meeting#LongChat>;
        <${solid.instance}> ?chat.
    OPTIONAL {
    ?chat <http://www.w3.org/2005/01/wf/flow#participation> ?participation.
    ?participation <${dct.references}> ?otherChat.
    }
  }`
  const bindingsStream = await traversalEngine.queryBindings(readIndexesQuery, {
    sources: [me],
    lenient: true,
    fetch: fullFetch,
  })

  const data = await bindings2data(bindingsStream)

  const chats = data.map(({ chat, otherChat }) =>
    [chat, otherChat].filter(c => Boolean(c)),
  ) as string[][]

  const folders = chats.map(t => t.map(chat => getContainer(chat)))

  const threads = [] // thread with latest message should come first

  for (const f of folders) {
    let messages: Message[] = []
    for (const folder of f) {
      messages = messages.concat(await readChatFromFolder(folder))
    }
    messages.sort(
      (msga, msgb) =>
        new Date(msga.createdAt).getTime() - new Date(msgb.createdAt).getTime(),
    )
    threads.push(messages)
  }

  const participants = await Promise.all(
    data.map(d => readChatParticipants(d.chat as string)),
  )

  return threads.map((thread, i) => ({
    participants: participants[i],
    messages: thread,
  }))
}

const readChatParticipants = async (chat: URI): Promise<URI[]> => {
  const readIndexesQuery = query`SELECT DISTINCT ?participant WHERE {
    <${chat}> <http://www.w3.org/2005/01/wf/flow#participation> ?participation.
    ?participation <http://www.w3.org/2005/01/wf/flow#participant> ?participant.
  }`
  const bindingsStream = await traversalEngine.queryBindings(readIndexesQuery, {
    sources: [chat],
    lenient: true,
    fetch: fullFetch,
  })

  const data = await bindings2data(bindingsStream)
  return data.map(d => d.participant as URI)
}

const readChatFromFolder = async (folder: URI): Promise<Message[]> => {
  const readChatQuery = query`SELECT DISTINCT ?message ?createdAt ?content ?author WHERE {
    <${folder}> <${ldp.contains}> ?year.
    ?year <${ldp.contains}> ?month.
    ?month <${ldp.contains}> ?day.
    ?day <${ldp.contains}> ?chat.
    ?asdf <${wf.message}> ?message.
    ?message
        <${dct.created}> ?createdAt;
        <${sioc.content}> ?content;
        <${foaf.maker}> ?author.
  }`
  const bindingsStream = await traversalEngine.queryBindings(readChatQuery, {
    sources: [folder],
    lenient: true,
    fetch: fullFetch,
  })

  const data = await bindings2data(bindingsStream)

  const messages = data.map(({ message, createdAt, content, author }) => ({
    id: message as string,
    message: content as string,
    createdAt: new Date(createdAt ?? '').getTime(),
    from: author as string,
    to: 'https://example.com', // this may be meaningless, or rather derived from the context of message's thread
  }))

  return messages
}

export const readMessages = async ({
  userId,
  me,
}: {
  userId: URI
  me: URI
}): Promise<Message[]> => {
  // find chats where the other user participates
  const readChatsWithUserQuery = query`SELECT DISTINCT ?chat WHERE {
    <${me}> <${solid.privateTypeIndex}> ?index.
    ?registration
        <${solid.forClass}> <http://www.w3.org/ns/pim/meeting#LongChat>;
        <${solid.instance}> ?chat.
    ?chat <http://www.w3.org/2005/01/wf/flow#participation> ?participation.
    ?participation <http://www.w3.org/2005/01/wf/flow#participant> <${userId}>.
  }`
  const bindingsStream = await traversalEngine.queryBindings(
    readChatsWithUserQuery,
    {
      sources: [me],
      lenient: true,
      fetch: fullFetch,
    },
  )

  const data = await bindings2data(bindingsStream)

  // get all referenced chats
  const chats = await Promise.all(
    data.map(d => getReferencedChats(d.chat ?? '')),
  )

  const folders = chats.flat().map(chat => getContainer(chat))

  const messages = (
    await Promise.all(folders.map(folder => readChatFromFolder(folder)))
  )
    .flat()
    .sort(
      (msga, msgb) =>
        new Date(msga.createdAt).getTime() - new Date(msgb.createdAt).getTime(),
    )

  return messages
}

/**
 * Get active chat between current and other user
 */
const getChat = async ({
  me,
  other,
}: {
  me: URI
  other: URI
}): Promise<URI | undefined> => {
  const readChatsWithUserQuery = query`SELECT DISTINCT ?chat ?participant WHERE {
    <${me}> <${solid.privateTypeIndex}> ?index.
    ?registration
        <${solid.forClass}> <http://www.w3.org/ns/pim/meeting#LongChat>;
        <${solid.instance}> ?chat.
    ?chat <http://www.w3.org/2005/01/wf/flow#participation> ?participation, ?p.
    ?participation <http://www.w3.org/2005/01/wf/flow#participant> <${other}>.
    ?p <http://www.w3.org/2005/01/wf/flow#participant> ?participant.
  }`
  const bindingsStream = await traversalEngine.queryBindings(
    readChatsWithUserQuery,
    {
      sources: [me],
      lenient: true,
      fetch: fullFetch,
    },
  )

  const data = await bindings2data(bindingsStream)
  const dicts = data.map(({ chat, participant }) =>
    Object.fromEntries([[chat, [participant]]]),
  )

  const dict: { [key: URI]: URI[] } = mergeWith(
    {},
    ...dicts,
    (objValue: any, srcValue: any) => {
      if (Array.isArray(objValue)) {
        return Array.from(new Set(objValue.concat(srcValue)))
      }
    },
  )
  const chat = Object.entries(dict)
    .filter(([, participants]) =>
      participants.every(p => p === me || p === other),
    )
    .map(([chat]) => chat)
    .pop()

  return chat
}

const getReferencedChats = async (chat: URI): Promise<URI[]> => {
  const readChatsWithUserQuery = query`SELECT ?chat WHERE {
    <${chat}> <http://www.w3.org/2005/01/wf/flow#participation> ?participation.
    ?participation <${dct.references}> ?chat.
  }`
  const bindingsStream = await traversalEngine.queryBindings(
    readChatsWithUserQuery,
    {
      sources: [chat],
      lenient: true,
      fetch: fullFetch,
    },
  )

  const data = await bindings2data(bindingsStream)

  return [chat, ...data.map(d => d.chat as URI)]
}

export const createMessage = async ({
  senderId, // is it really necessary?
  receiverId,
  message,
}: {
  senderId: URI
  receiverId: URI
  message: string
}) => {
  const xsd = 'http://www.w3.org/2001/XMLSchema#'

  // save message to my own pod
  const chat = await getChat({ me: senderId, other: receiverId })

  if (!chat) throw new Error('Implement creating a new chat')

  const container = getContainer(chat)

  const date = new Date()
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  const chatFile = `${container}${year}/${month}/${day}/chat.ttl`
  const id = `${chatFile}#msg-${uuid.v4()}`
  const msgNode = namedNode(id)

  const insertions: Quad[] = []

  const dateLiteral = literal(
    new Date().toISOString(),
    namedNode(xsd + 'dateTime'),
  )

  insertions.push(
    quad(msgNode, namedNode(foaf.maker), namedNode(senderId)),
    quad(msgNode, namedNode(sioc.content), literal(message)),
    quad(msgNode, namedNode(dct.created), dateLiteral),
    quad(namedNode(chat), namedNode(wf.message), msgNode),
    // TODO consider adding signature
  )

  const newMessageQuery = query`INSERT DATA { ${insertions} }`

  /*
  console.log(newMessageQuery)

  await simpleEngine.queryVoid(newMessageQuery, {
    sources: [chatFile],
    destination: { value: chatFile },
    fetch,
  })
  */

  await fetch(chatFile, {
    method: 'PATCH',
    body: newMessageQuery,
    headers: { 'content-type': 'application/sparql-update' },
  })

  // save notification to other person's inbox
  const inbox = await getInbox(receiverId)
  const node = namedNode('')
  const notificationQuads = [
    quad(node, namedNode(rdf.type), namedNode(as.Add)),
    quad(node, namedNode(as.actor), namedNode(senderId)),
    quad(
      node,
      namedNode(as.context),
      namedNode('https://www.pod-chat.com/LongChatMessage'),
    ),
    quad(node, namedNode(as.object), msgNode),
    quad(node, namedNode(as.target), namedNode(chat)),
    quad(node, namedNode(as.updated), dateLiteral),
  ]

  const notificationQuery = query`${notificationQuads}`

  await fetch(inbox, {
    method: 'POST',
    body: notificationQuery,
    headers: { 'content-type': 'text/turtle' },
  })
  await traversalEngine.invalidateHttpCache()
}

const getInbox = async (webId: URI): Promise<URI> => {
  const readInboxQuery = query`SELECT ?inbox WHERE {
    <${webId}> <${ldp.inbox}> ?inbox.
  }`
  const bindingsStream = await traversalEngine.queryBindings(readInboxQuery, {
    sources: [webId],
    lenient: true,
    fetch: fullFetch,
  })

  const data = await bindings2data(bindingsStream)

  if (data.length === 0) throw new Error('Person has no inbox')

  return data[0].inbox as string
}
