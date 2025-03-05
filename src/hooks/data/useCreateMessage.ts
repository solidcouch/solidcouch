import {
  ChatShapeShapeType,
  MessageActivityShapeType,
} from '@/ldo/app.shapeTypes'
import { ChatMessageShape, ChatShape } from '@/ldo/app.typings'
import { AuthorizationShapeType } from '@/ldo/wac.shapeTypes'
import { URI } from '@/types'
import { getAcl, getContainer } from '@/utils/helpers'
import { acl, meeting } from '@/utils/rdf-namespaces'
import { BasicLdSet } from '@ldo/jsonld-dataset-proxy'
import dayjs from 'dayjs'
import { as } from 'rdf-namespaces'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  useCreateRdfDocument,
  useDeleteRdfDocument,
  useUpdateLdoDocument,
} from './useRdfDocument'
import { useSaveTypeRegistration } from './useSetupHospex'

export const useCreateMessage = () => {
  const queryMutation = useUpdateLdoDocument(ChatShapeShapeType)
  return useCallback(
    async ({
      senderId,
      message,
      chat,
    }: {
      senderId: URI
      message: string
      chat: URI
    }) => {
      const container = getContainer(chat)
      const chatFile = `${container}${dayjs().format('YYYY/MM/DD')}/chat.ttl`
      const id = `${chatFile}#msg-${uuidv4()}`
      const createdAt = new Date().toISOString()
      // create the message
      await queryMutation.mutateAsync({
        uri: getContainer(chat) + dayjs().format('YYYY/MM/DD') + '/chat.ttl',
        subject: chat,
        transform: ldo => {
          ldo.message?.add({
            '@id': id,
            created: createdAt,
            content: message,
            maker: { '@id': senderId },
          })
        },
      })

      return { messageId: id, todayChat: chatFile, createdAt }
    },
    [queryMutation],
  )
}

export const useCreateMessageNotification = () => {
  const queryMutation = useCreateRdfDocument(MessageActivityShapeType)
  return useCallback(
    async ({
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
      // create the message
      await queryMutation.mutateAsync({
        uri: inbox,
        method: 'POST',
        data: {
          '@id': '',
          type: { '@id': 'Add' },
          actor: { '@id': senderId },
          context: { '@id': 'https://www.pod-chat.com/LongChatMessage' },
          object: {
            '@id': messageId,
            type: { '@id': as.Note },
            created: updated,
            content,
            maker: { '@id': senderId },
          } as ChatMessageShape,
          target: { '@id': chatId } as ChatShape,
          updated,
        },
      })
    },
    [queryMutation],
  )
}

export const useCreateChat = () => {
  const createChatMutation = useCreateRdfDocument(ChatShapeShapeType)
  const createAclMutation = useCreateRdfDocument(AuthorizationShapeType)
  const updatePrivateIndex = useSaveTypeRegistration()

  return useCallback(
    async ({
      me,
      otherPerson,
      otherChat,
      hospexContainer,
      privateTypeIndex,
    }: {
      me: URI
      otherPerson: URI
      otherChat?: URI
      hospexContainer: URI
      privateTypeIndex: URI
    }) => {
      // create index.ttl on my pod and fill it with info
      const chatContainer = `${hospexContainer}messages/${uuidv4()}/`
      const chatFile = `${chatContainer}index.ttl`
      const chatId = `${chatFile}#this`
      const date = new Date().toISOString()

      // save chat
      await createChatMutation.mutateAsync({
        uri: chatFile,
        data: {
          '@id': chatId,
          type: { '@id': 'LongChat' },
          author: { '@id': me },
          created: date,
          title: 'Hospex chat channel',
        },
        transform: ldo => {
          ldo.participation
            ?.add({
              '@id': `${chatFile}#${uuidv4()}`,
              dtstart: date,
              participant: { '@id': me },
            })
            .add({
              '@id': `${chatFile}#${uuidv4()}`,
              dtstart: date,
              participant: { '@id': otherPerson },
            })
          if (otherChat)
            ldo.participation
              ?.filter(p => p.participant['@id'] === otherPerson)
              .forEach(p =>
                p.references?.add({ '@id': otherChat } as ChatShape),
              )
        },
      })
      // set permissions
      const aclUri = await getAcl(chatContainer)

      await createAclMutation.mutateAsync({
        uri: aclUri,
        data: [
          {
            '@id': aclUri + '#ReadWriteControl',
            type: { '@id': 'Authorization' },
            agent: new BasicLdSet([{ '@id': me }]),
            accessTo: new BasicLdSet([{ '@id': chatContainer }]),
            default: { '@id': chatContainer },
            mode: new BasicLdSet([
              { '@id': acl.Read },
              { '@id': acl.Write },
              { '@id': acl.Control },
            ]),
          },
          {
            '@id': aclUri + '#Read',
            type: { '@id': 'Authorization' },
            agent: new BasicLdSet([{ '@id': otherPerson }]),
            accessTo: new BasicLdSet([{ '@id': chatContainer }]),
            default: { '@id': chatContainer },
            mode: new BasicLdSet([{ '@id': acl.Read }]),
          },
        ],
      })

      // save to privateTypeIndex
      await updatePrivateIndex({
        index: privateTypeIndex,
        type: meeting.LongChat,
        location: chatId,
      })

      return { chatContainer, chatFile, chatId }
    },
    [createAclMutation, createChatMutation, updatePrivateIndex],
  )
}

/**
 *
 * @param chat - chat of person receiving notification
 * @param otherChat - chat of person sending notification
 * @param otherPerson - person sending notification
 */
export const useProcessNotification = () => {
  const updateChat = useUpdateLdoDocument(ChatShapeShapeType)
  const deleteNotification = useDeleteRdfDocument()
  return useCallback(
    async ({
      notificationId,
      chat,
      otherChat,
      otherPerson,
    }: {
      notificationId: URI
      chat: URI
      otherChat: URI
      otherPerson: URI
    }) => {
      // we need to have notification info
      // at this point my chat must exist
      // and we add other chat to my chat as referenced chat
      // TODO check that otherChat correctly references this chat, and only this chat, or references nothing
      try {
        await updateChat.mutateAsync({
          uri: chat,
          subject: chat,
          transform: ldo => {
            if (!ldo.participation) throw new Error('no participation')
            if (ldo.participation && ldo.participation.size > 2)
              throw new Error(
                'too much participation (only 2 people supported!)',
              )
            const participation = ldo.participation
              ?.toArray()
              .find(p => p.participant?.['@id'] === otherPerson)

            if (!participation)
              throw new Error("other person's participation not found")

            if (
              participation.references?.size === 1 &&
              participation.references.toArray()[0]!['@id'] === otherChat
            )
              throw new Error('already updated')

            if (participation.references && participation.references.size > 0)
              throw new Error(
                'participation already references some other chat',
              )

            participation.references?.add({ '@id': otherChat } as ChatShape)
          },
        })
      } catch (error) {
        if (error instanceof Error && error.message === 'already updated') {
          // do nothing
        } else throw error
      }

      await deleteNotification.mutateAsync({ uri: notificationId })
    },
    [deleteNotification, updateChat],
  )
}
