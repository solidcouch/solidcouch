import { QueryEngine } from '@comunica/query-sparql'
import { QueryEngine as TraversalQueryEngine } from '@comunica/query-sparql-link-traversal'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { mergeWith } from 'lodash'
import { DataFactory, Quad } from 'n3'
import { Message, Thread, URI } from 'types'
import { fullFetch, getContainer } from 'utils/helpers'
import {
  acl,
  as,
  cal,
  dct,
  foaf,
  hospex,
  ldp,
  meeting,
  rdf,
  sioc,
  solid,
  ui,
  wf,
  xsd,
} from 'utils/rdf-namespaces'
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
        <${solid.forClass}> <${meeting.LongChat}>;
        <${solid.instance}> ?chat.
    OPTIONAL {
    ?chat <${wf.participation}> ?participation.
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
    <${chat}> <${wf.participation}> ?participation.
    ?participation <${wf.participant}> ?participant.
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
        <${solid.forClass}> <${meeting.LongChat}>;
        <${solid.instance}> ?chat.
    ?chat <${wf.participation}> ?participation.
    ?participation <${wf.participant}> <${userId}>.
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
        <${solid.forClass}> <${meeting.LongChat}>;
        <${solid.instance}> ?chat.
    ?chat <${wf.participation}> ?participation, ?p.
    ?participation <${wf.participant}> <${other}>.
    ?p <${wf.participant}> ?participant.
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
    <${chat}> <${wf.participation}> ?participation.
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

const getHospexContainer = async (webId: URI) => {
  await traversalEngine.invalidateHttpCache()
  const hospexDocumentQuery = query`
    SELECT ?hospexDocument WHERE {
      <${webId}> <${solid.publicTypeIndex}> ?index.
      ?index
        <${rdf.type}> <${solid.TypeIndex}>;
        <${dct.references}> ?typeRegistration.
      ?typeRegistration
        <${rdf.type}> <${solid.TypeRegistration}>;
        <${solid.forClass}> <${hospex.PersonalHospexDocument}>;
        <${solid.instance}> ?hospexDocument.
    }`

  const documentStream = await traversalEngine.queryBindings(
    hospexDocumentQuery,
    { sources: [webId], fetch: fullFetch, lenient: true },
  )
  const documents = (await bindings2data(documentStream)).map(
    ({ hospexDocument }) => hospexDocument as URI,
  )

  if (documents.length !== 1)
    throw new Error(
      'hospex document not setup or we have multiple hospex documents TODO distinguish correct hospex document for this community',
    )

  const hospexContainer = getContainer(documents[0])
  return hospexContainer
}

const createChat = async ({
  me,
  other,
  otherChat,
}: {
  me: URI
  other: URI
  otherChat?: URI
}) => {
  const storage = await getHospexContainer(me)
  // create index.ttl on my pod and fill it with info
  const chatContainer = `${storage}messages/${uuid.v4()}/`
  const chatFile = chatContainer + 'index.ttl'
  const chat = chatFile + '#this'

  const dateLiteral = literal(new Date().toISOString(), namedNode(xsd.dateTime))

  const chatNode = namedNode(chat)
  const myParticipationNode = namedNode(`${chatFile}#${uuid.v4()}`)
  const otherParticipationNode = namedNode(`${chatFile}#${uuid.v4()}`)
  const quads = [
    quad(chatNode, namedNode(rdf.type), namedNode(meeting.LongChat)),
    quad(chatNode, namedNode(dct.creator), namedNode(me)),
    quad(chatNode, namedNode(dct.created), dateLiteral),
    quad(chatNode, namedNode(dct.title), literal('Hospex chat channel')),
    quad(
      chatNode,
      namedNode(ui.sharedPreferences),
      namedNode(chatFile + '#SharedPreferences'),
    ),
    quad(chatNode, namedNode(wf.participation), myParticipationNode),
    quad(chatNode, namedNode(wf.participation), otherParticipationNode),
    quad(myParticipationNode, namedNode(wf.participant), namedNode(me)),
    quad(myParticipationNode, namedNode(cal.dtstart), dateLiteral),
    quad(otherParticipationNode, namedNode(wf.participant), namedNode(other)),
    quad(otherParticipationNode, namedNode(cal.dtstart), dateLiteral),
  ]

  if (otherChat) {
    quads.push(
      quad(
        otherParticipationNode,
        namedNode(dct.references),
        namedNode(otherChat),
      ),
    )
  }

  // we'll put it to our hospex container
  await simpleEngine.queryVoid(query`INSERT DATA {${quads}}`, {
    sources: [chatFile],
    destination: { type: 'patchSparqlUpdate', value: chatFile },
    fetch,
  })

  // set up correct access to chat folder
  const accessFile = chatContainer + '.acl'
  const ownerNode = namedNode(accessFile + '#ControlReadWrite')
  const readerNode = namedNode(accessFile + '#Read')

  const accessQuads = [
    // owner
    quad(ownerNode, namedNode(rdf.type), namedNode(acl.Authorization)),
    quad(ownerNode, namedNode(acl.agent), namedNode(me)),
    quad(ownerNode, namedNode(acl.accessTo), namedNode(chatContainer)),
    quad(
      ownerNode,
      namedNode(acl.default__workaround),
      namedNode(chatContainer),
    ),
    quad(ownerNode, namedNode(acl.mode), namedNode(acl.Control)),
    quad(ownerNode, namedNode(acl.mode), namedNode(acl.Read)),
    quad(ownerNode, namedNode(acl.mode), namedNode(acl.Write)),
    // reader
    quad(readerNode, namedNode(rdf.type), namedNode(acl.Authorization)),
    quad(readerNode, namedNode(acl.agent), namedNode(other)),
    quad(readerNode, namedNode(acl.accessTo), namedNode(chatContainer)),
    quad(
      readerNode,
      namedNode(acl.default__workaround),
      namedNode(chatContainer),
    ),
    quad(readerNode, namedNode(acl.mode), namedNode(acl.Read)),
  ]
  await simpleEngine.queryVoid(query`INSERT DATA {${accessQuads}}`, {
    sources: [accessFile],
    destination: { type: 'patchSparqlUpdate', value: accessFile },
    fetch,
  })

  // save reference to index.ttl#this in my privateTypeIndex
  const readPrivateIndexQuery = query`SELECT ?index WHERE {
    <${me}> <${solid.privateTypeIndex}> ?index.
  }`

  const bindings = await simpleEngine.queryBindings(readPrivateIndexQuery, {
    sources: [me],
    fetch: fullFetch,
  })
  const privateIndex = (await bindings2data(bindings))[0]?.index

  if (!privateIndex) throw new Error('Private type index not found')

  const registrationNode = namedNode(privateIndex + '#' + uuid.v4())
  const indexQuads = [
    quad(namedNode(privateIndex), namedNode(dct.references), registrationNode),
    quad(
      registrationNode,
      namedNode(rdf.type),
      namedNode(solid.TypeRegistration),
    ),
    quad(
      registrationNode,
      namedNode(solid.forClass),
      namedNode(meeting + 'LongChat'),
    ),
    quad(registrationNode, namedNode(solid.instance), namedNode(chat)),
  ]
  await simpleEngine.queryVoid(query`INSERT DATA {${indexQuads}}`, {
    sources: [privateIndex],
    destination: { type: 'patchSparqlUpdate', value: privateIndex },
    fetch,
  })

  return chat
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
  // save message to my own pod
  let chat = await getChat({ me: senderId, other: receiverId })

  if (!chat) {
    chat = await createChat({
      me: senderId,
      other: receiverId,
    })
  }

  const container = getContainer(chat)

  const date = new Date()
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  const chatFile = `${container}${year}/${month}/${day}/chat.ttl`
  const id = `${chatFile}#msg-${uuid.v4()}`
  const msgNode = namedNode(id)

  const insertions: Quad[] = []

  const dateLiteral = literal(new Date().toISOString(), namedNode(xsd.dateTime))

  insertions.push(
    quad(msgNode, namedNode(foaf.maker), namedNode(senderId)),
    quad(msgNode, namedNode(sioc.content), literal(message)),
    quad(msgNode, namedNode(dct.created), dateLiteral),
    quad(namedNode(chat), namedNode(wf.message), msgNode),
    // TODO consider adding signature
  )

  const newMessageQuery = query`INSERT DATA { ${insertions} }`

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
