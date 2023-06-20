import { QueryEngine as TraversalQueryEngine } from '@comunica/query-sparql-link-traversal/lib/index-browser'
import { QueryEngine } from '@comunica/query-sparql/lib/index-browser'
import { fetch } from '@inrupt/solid-client-authn-browser'
import dayjs from 'dayjs'
import { mergeWith, uniq } from 'lodash'
import { DataFactory, Quad } from 'n3'
import { Message, Thread, URI } from 'types'
import { fullFetch, getContainer } from 'utils/helpers'
import {
  acl,
  as,
  cal,
  dc,
  dct,
  foaf,
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
import { getHospexContainer } from './generic'
import { bindings2data, query } from './helpers'

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
  const { privateIndices } = await getTypeIndices(me)
  const readIndexesQuery = query`SELECT * WHERE {
    ?registration
        <${solid.forClass}> <${meeting.LongChat}>;
        <${solid.instance}> ?chat.
    OPTIONAL {
    ?chat <${wf.participation}> ?participation.
    ?participation <${dct.references}> ?otherChat.
    }
  }`
  const bindingsStream = await traversalEngine.queryBindings(readIndexesQuery, {
    sources: privateIndices,
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

  const output: Thread[] = threads.map((thread, i) => ({
    id: '',
    related: [],
    participants: participants[i],
    messages: thread,
  }))

  /****** read messages from inbox */
  const inboxMessages = await readMessagesFromInbox(me)

  // add each inbox message to the thread it belongs to
  inboxMessages.forEach(im => {
    // try to find proper thread
    const thread = output.find(t => t.participants.includes(im.actor))

    if (thread) {
      thread.messages.push(im.message)
      thread.messages.sort(
        (msga, msgb) =>
          new Date(msga.createdAt).getTime() -
          new Date(msgb.createdAt).getTime(),
      )

      if (!thread.status) {
        thread.status = 'unread'
      }
    }

    // if not found, add to the end
    else {
      output.push({
        id: '',
        related: [],
        messages: [im.message],
        // TODO actor in inbox can be easily faked
        // we may want to take this from im.message.from
        // and actually, we want to verify the message
        // actor should match message.from should match chat participant, and chats should also match
        participants: [im.actor],
        status: 'new',
      })
    }
  })

  return output
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
    chat: '',
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
  await invalidateCache()
  // // find chats where the other user participates
  // const readChatsWithUserQuery = query`SELECT DISTINCT ?chat WHERE {
  //   <${me}> <${solid.privateTypeIndex}> ?index.
  //   ?registration
  //       <${solid.forClass}> <${meeting.LongChat}>;
  //       <${solid.instance}> ?chat.
  //   ?chat <${wf.participation}> ?participation.
  //   ?participation <${wf.participant}> <${userId}>.
  // }`

  // const te = new TraversalQueryEngine()
  // await invalidateCache()
  // await te.invalidateHttpCache()
  // console.log(staticLog, readChatsWithUserQuery)
  // const bindingsStream = await te.queryBindings(readChatsWithUserQuery, {
  //   sources: [me],
  //   lenient: true,
  //   fetch: fullFetch,
  // })
  // const data = await bindings2data(bindingsStream)
  // console.log(staticLog, data, '..**..**..')

  const myChat = await getChat({ me, other: userId })

  // get all referenced chats
  const chats = myChat ? await getReferencedChats(myChat) : []

  const folders = chats.flat().map(chat => getContainer(chat))

  const messages = (
    await Promise.all(folders.map(folder => readChatFromFolder(folder)))
  )
    .flat()
    .sort(
      (msga, msgb) =>
        new Date(msga.createdAt).getTime() - new Date(msgb.createdAt).getTime(),
    )

  const messagesFromInbox = (await readMessagesFromInbox(me)).filter(
    n => n.message.from === userId,
  )

  messagesFromInbox.forEach(im => {
    // if message is there, update status of the message
    const msg = messages.find(m => m.id === im.message.id)
    if (msg) {
      msg.status = 'unread'
      msg.notification = im.notification
    }
    // otherwise add it to the array of messages
    else {
      messages.push({
        ...im.message,
        status: 'unread',
        notification: im.notification,
      })
      messages.sort(
        (msga, msgb) =>
          new Date(msga.createdAt).getTime() -
          new Date(msgb.createdAt).getTime(),
      )
    }
  })

  return messages
}

const getTypeIndices = async (
  webId: URI,
): Promise<{
  publicIndices: URI[]
  privateIndices: URI[]
}> => {
  const readChatsWithUserQuery = query`SELECT DISTINCT ?public ?private WHERE {
    <${webId}> <${solid.privateTypeIndex}> ?private;
               <${solid.publicTypeIndex}> ?public.
  }`
  const bindingsStream = await simpleEngine.queryBindings(
    readChatsWithUserQuery,
    {
      sources: [webId],
      lenient: true,
      fetch: fullFetch,
    },
  )
  const data = await bindings2data(bindingsStream)
  const publicIndices = uniq(data.map(d => d.public as URI))
  const privateIndices = uniq(data.map(d => d.private as URI))

  return { publicIndices, privateIndices }
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
  await invalidateCache()
  const traversalEngine = new TraversalQueryEngine()

  const { privateIndices } = await getTypeIndices(me)

  const readChatsWithUserQuery = query`SELECT DISTINCT ?chat ?participant WHERE {
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
      sources: privateIndices,
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
  await invalidateCache()
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
    quad(
      chatNode,
      namedNode(dc.creator.replace('creator', 'author')), // for compatibility with pod-chat.com
      namedNode(me),
    ),
    quad(chatNode, namedNode(dct.created), dateLiteral),
    quad(
      chatNode,
      namedNode(dc.creator.replace('creator', 'created')), // for compatibility with pod-chat.com
      dateLiteral,
    ),
    quad(chatNode, namedNode(dct.title), literal('Hospex chat channel')),
    quad(chatNode, namedNode(dc.title), literal('Hospex chat channel')), // for compatibility with pod-chat.com
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
      namedNode(meeting.LongChat),
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

  const chatFile = `${container}${dayjs().format('YYYY/MM/DD')}/chat.ttl`
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

export const getInbox = async (webId: URI): Promise<URI> => {
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

export const readMessagesFromInbox = async (webId: URI) => {
  await invalidateCache()
  const readInboxQuery = query`SELECT * WHERE {
    <${webId}> <${ldp.inbox}> ?inbox.
    ?inbox <${ldp.contains}> ?notification.
    ?notification
        <${as.context}> <https://www.pod-chat.com/LongChatMessage>;
        <${as.object}> ?message;
        <${as.target}> ?chat;
        <${as.actor}> ?actor.
  }`
  const bindingsStream = await traversalEngine.queryBindings(readInboxQuery, {
    sources: [webId],
    lenient: true,
    fetch: fullFetch,
  })
  const data = await bindings2data(bindingsStream)
  const messages = await Promise.all(
    data.map(({ message }) => readMessage(message as URI)),
  )

  return data.map((d, i) => ({
    chat: d.chat as URI,
    actor: d.actor as URI,
    notification: d.notification as URI,
    message: messages[i],
  }))
}

const readMessage = async (messageId: URI): Promise<Message> => {
  const readInboxQuery = query`SELECT ?author ?content ?createdAt WHERE {
    <${messageId}>
        <${dct.created}> ?createdAt;
        <${sioc.content}> ?content;
        <${foaf.maker}> ?author.
  }`
  const bindingsStream = await simpleEngine.queryBindings(readInboxQuery, {
    sources: [messageId],
    lenient: true,
    fetch: fullFetch,
  })

  const data = await bindings2data(bindingsStream)

  if (data.length < 1) throw new Error('Message not found')
  const { createdAt, content, author } = data[0]
  return {
    id: messageId,
    message: content as string,
    from: author as URI,
    createdAt: new Date(createdAt as string).getTime(),
    chat: '',
  }
}

/**
 *
 * TODO Right now this method will behave unexpectedly for group chats
 * check our assumptions!
 */
export const processNotification = async ({
  id,
  me,
  other,
}: {
  id: URI
  me: URI
  other: URI
}) => {
  await invalidateCache()

  const simpleEngine = new QueryEngine()

  const readNotificationQuery = query`SELECT * WHERE {
    ?notification
        <${as.context}> <https://www.pod-chat.com/LongChatMessage>;
        <${as.object}> ?message;
        <${as.target}> ?chat;
        <${as.actor}> ?actor.
  }`
  const bs = await simpleEngine.queryBindings(readNotificationQuery, {
    sources: [id],
    fetch,
  })
  const data = await bindings2data(bs)

  if (data.length === 0) throw new Error('Notification not found')

  const otherChat = data[0].chat as URI

  if (data[0].actor !== other)
    throw new Error('The notification actor does not fit the other person')

  // TODO verify the other chat and message - that they have correct participants and authors

  // see if my chat exists
  const chat = await getChat({ me, other })

  // if my chat doesn't exist
  if (!chat) {
    // create it
    // TODO we should verify and confirm this kind of action first
    // because malevolent user can do bad stuff here
    await createChat({ me, other, otherChat })
  }
  // if my chat exists
  else {
    // see if my chat contains the other chat
    const referenced = (await getReferencedChats(chat)).filter(c => c !== chat)

    // if my chat exists, but doesn't contain the other chat, add the other chat
    if (referenced.length === 0) {
      const saveChatReferenceQuery = query`INSERT {
        ?participation <${dct.references}> <${otherChat}>.
      } WHERE {
        <${chat}> <${wf.participation}> ?participation.
        ?participation <${wf.participant}> <${other}>.
      }`

      await simpleEngine.queryVoid(saveChatReferenceQuery, {
        sources: [chat],
        destination: { type: 'patchSparqlUpdate', value: chat },
        fetch,
      })
    }
  }
  // verify that my chat exists and it contains the other chat
  await invalidateCache()
  const chatVerification = await getChat({ me, other })
  if (!chatVerification) throw new Error('chat still does not exist!')
  const chats = await getReferencedChats(chatVerification)
  const ok =
    chats.length === 2 &&
    chats.includes(chatVerification) &&
    chats.includes(otherChat)

  if (!ok)
    throw new Error(
      'chat still does not reference the other chat, or it references other chats',
    )
  // at the end, remove the notification
  await fetch(id, { method: 'DELETE' })
  // and invalidate query engines
  await invalidateCache()
}

const invalidateCache = () =>
  Promise.all([
    simpleEngine.invalidateHttpCache(),
    traversalEngine.invalidateHttpCache(),
  ])
