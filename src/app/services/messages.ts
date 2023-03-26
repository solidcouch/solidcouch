import { QueryEngine } from '@comunica/query-sparql'
import { QueryEngine as TraversalQueryEngine } from '@comunica/query-sparql-link-traversal'
import { dct, foaf, ldp, sioc, solid, wf } from 'rdf-namespaces'
import { Message, Thread, URI } from 'types'
import { fullFetch, getContainer } from 'utils/helpers'
import { query } from './comunicaApi'
import { bindings2data } from './helpers'

const traversalEngine = new TraversalQueryEngine()
const simpleEngine = new QueryEngine()

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
}) => {}
