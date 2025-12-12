import {
  ChatShapeShapeType,
  MessageActivityShapeType,
} from '@/ldo/app.shapeTypes'
import { ChatMessageShape, ChatShape } from '@/ldo/app.typings'
import { AuthorizationShapeType } from '@/ldo/wac.shapeTypes'
import { URI } from '@/types'
import { HttpError } from '@/utils/errors'
import { getAcl } from '@/utils/helpers'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { createSolidLdoDataset, type SolidLeafUri } from '@ldo/connected-solid'
import { createLdoDataset, set, toTurtle } from '@ldo/ldo'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { v4 } from 'uuid'
import { updateLdoDocument } from '../useRdfDocument'

dayjs.extend(utc)

export const createChatChannel = async ({
  title,
  owner,
  participants,
  rootStorage,
}: {
  title: string
  owner: SolidLeafUri
  participants: SolidLeafUri[]
  rootStorage?: URI
}) => {
  // https://solid.github.io/chat/#channel
  const solidLdoDataset = createSolidLdoDataset()
  solidLdoDataset.setContext('solid', { fetch })

  const channelRoot = new URL(
    `hospex/messages/${v4()}/`,
    rootStorage,
  ).toString()
  const channelUri = new URL(`index.ttl#this`, channelRoot).toString()

  const channelLdo = createLdoDataset()
    .usingType(ChatShapeShapeType)
    .fromSubject(channelUri)

  channelLdo.type = { '@id': 'LongChat' }
  channelLdo.title = title
  channelLdo.participation = set({
    participant: { '@id': owner },
    dtstart: new Date().toISOString(),
  })

  // create chat channel
  await fetch(channelUri, {
    method: 'PUT',
    body: await toTurtle(channelLdo),
    headers: { 'content-type': 'text/turtle' },
  })

  const aclUri = await getAcl(channelRoot)

  const aclLdo = createLdoDataset()
  const ownLdo = aclLdo
    .usingType(AuthorizationShapeType)
    .fromSubject('#ReadWriteControl')
  ownLdo.type = { '@id': 'Authorization' }
  ownLdo.agent = set({ '@id': owner })
  ownLdo.accessTo = set({ '@id': channelRoot })
  ownLdo.default = { '@id': channelRoot }
  ownLdo.mode = set({ '@id': 'Read' }, { '@id': 'Write' }, { '@id': 'Control' })

  const appendLdo = aclLdo
    .usingType(AuthorizationShapeType)
    .fromSubject('#Append')
  appendLdo.type = { '@id': 'Authorization' }
  appendLdo.agent = set(
    ...participants.filter(p => p !== owner).map(webId => ({ '@id': webId })),
  )
  appendLdo.accessTo = set({ '@id': channelRoot })
  appendLdo.default = { '@id': channelRoot }
  appendLdo.mode = set({ '@id': 'Read' }, { '@id': 'Append' })

  await fetch(aclUri, {
    method: 'PUT',
    body: (await toTurtle(ownLdo)) + '\n' + (await toTurtle(appendLdo)),
    headers: { 'content-type': 'text/turtle' },
  })

  return { channel: channelUri }
}

export const createMessage = async ({
  channel,
  message,
  maker,
}: {
  channel: string
  message: string
  maker: SolidLeafUri
}) => {
  const resourceUrl = new URL(
    `${dayjs().utc().format('YYYY/MM/DD')}/chat.ttl`,
    channel,
  )
  const uuid = v4()
  const messageUri = new URL(`#${uuid}`, resourceUrl).toString()

  const ldoDataset = createLdoDataset()
  const ldo = ldoDataset.usingType(ChatShapeShapeType).fromSubject(channel)

  const created = new Date().toISOString()

  ldo.message2?.add({
    '@id': messageUri,
    created,
    content: message,
    maker: { '@id': maker },
  })

  const turtle = await toTurtle(ldo)
  const response = await fetch(resourceUrl, {
    method: `PATCH`,
    headers: {
      'content-type': 'text/n3',
    },
    body: `
      @prefix solid: <http://www.w3.org/ns/solid/terms#>.
      _:update a solid:InsertDeletePatch;
        solid:inserts {${turtle}} .
    `,
  })

  if (!response.ok) throw new HttpError('HTTP Error', response)

  return { messageUri, created }
}

export const createMessageNotification = async ({
  inbox,
  senderId,
  messageId,
  chatId,
  updated,
  content,
}: {
  inbox: URI
  senderId: URI
  messageId: URI
  chatId: URI
  updated: string // date as isostring
  content: string
}) => {
  if (!inbox) throw new Error('Inbox is not provided')

  const ldoDataset = createLdoDataset()
  const ldo = ldoDataset.usingType(MessageActivityShapeType).fromSubject('')
  ldo.type = { '@id': 'Create' }
  ldo.actor = { '@id': senderId }
  ldo.object = {
    type: { '@id': 'Message' },
    '@id': messageId,
    content,
    created: updated,
  } as ChatMessageShape
  ldo.target = { '@id': chatId } as ChatShape

  const response = await fetch(new URL(inbox), {
    method: 'POST',
    headers: {
      'content-type': 'text/turtle',
    },
    body: await toTurtle(ldo),
  })

  if (!response.ok) throw new HttpError('HTTP Error', response)
}

export const addParticipant = async ({
  channel,
  participant,
}: {
  channel: URI
  participant: URI
}) =>
  await updateLdoDocument(ChatShapeShapeType)({
    uri: channel,
    subject: channel,
    transform: ldo => {
      ldo.participation ??= set()
      const isThere = ldo.participation.some(
        p => p.participant['@id'] === participant,
      )
      if (isThere) return
      ldo.participation.add({
        '@id': '#' + v4(),
        dtstart: new Date().toISOString(),
        participant: { '@id': participant },
      })
    },
  })
