import { useParse, useParseWithParam, useResults } from 'hooks/queryHelpers'
import { useSolidDocuments } from 'hooks/useSolidDocument'
import { zip } from 'lodash'
import {
  getChatsFromTypeIndex,
  getContains,
  getMessagesFromDocument,
  getRelatedChats,
  getTypeIndexes,
} from 'parsers'
import { useCallback, useMemo } from 'react'
import { Message, Thread, URI } from 'types'
import { getContainer } from 'utils/helpers'

export const useReadThreads = (webId: URI) => {
  // read my profile and type indexes, especially private
  // read profile and find type index of each member
  // TODO also check useReadAccommodations to DRY this
  const personIdParam = useMemo(() => [webId], [webId])
  // TODO also fetch extended profile documents
  const profileDocResults = useSolidDocuments(personIdParam)
  const profileDocs = useResults(profileDocResults)
  const typeIndexes = useParse(
    personIdParam,
    profileDocs,
    getTypeIndexes,
    combineIndexes,
  )

  // find relevant chats in type indexes
  const typeIndexResults = useSolidDocuments(typeIndexes)
  const typeIndexDocs = useResults(typeIndexResults)
  const chatIds = useParse(
    typeIndexes,
    typeIndexDocs,
    getChatsFromTypeIndex,
    useCallback((a: URI[][]) => a.flat(), []),
  )

  // fetch LongChat index.ttl
  const chatResults = useSolidDocuments(chatIds)
  // find the chat of the other user(s)
  const chatDocs = useResults(chatResults)
  const collectedChats = useParse(
    chatIds,
    chatDocs,
    getRelatedChats,
    useCallback(
      (a: { chat: URI; relatedChats: URI[]; participants: URI[] }[]) =>
        a.flat(),
      [],
    ),
  )

  const allChats = useMemo(() => {
    return collectedChats.map(c => [c.chat, ...c.relatedChats]).flat()
  }, [collectedChats])

  const { data: files } = useChatFiles(allChats)
  const allFiles = useMemo(() => Object.values(files).flat(), [files])
  const allFileChats = useMemo(
    () =>
      allFiles.map(
        file =>
          Object.entries(files).find(entry => entry[1].includes(file))?.[0] ??
          '',
      ),
    [allFiles, files],
  )
  const msgDocResults = useSolidDocuments(allFiles)
  const msgDocs = useResults(msgDocResults)
  const messagesDict = useParseWithParam(
    allFiles,
    allFileChats,
    msgDocs,
    getMessagesFromDocument,
    useCallback((messages: Message[][], chats: URI[]) => {
      const chatMessageDicts = zip(chats, messages).map(([chat, messages]) => ({
        [chat as URI]: messages ?? [],
      }))

      const chatMessageDict: { [chat: URI]: Message[] } = {}

      chatMessageDicts.forEach(dict => {
        Object.entries(dict).forEach(([chat, messages]) => {
          chatMessageDict[chat] = (chatMessageDict[chat] ?? []).concat(messages)
        })
      })
      return chatMessageDict
    }, []),
  )

  const threads: Thread[] = useMemo(
    () =>
      collectedChats
        .map(cc => ({
          id: cc.chat,
          participants: cc.participants,
          messages: [cc.chat, ...cc.relatedChats]
            .flatMap(chat => messagesDict[chat])
            .sort((a, b) => a.createdAt - b.createdAt),
        }))
        .sort(
          (a, b) =>
            ([...b.messages].pop()?.createdAt ?? 0) -
            ([...a.messages].pop()?.createdAt ?? 0),
        ),
    [collectedChats, messagesDict],
  )

  return threads
}

export const useReadMessagesFromInbox = () => {}

const combineIndexes = (indexes: { public: URI[]; private: URI[] }[]) =>
  indexes.flatMap(i => [...i.private, ...i.public])

const useChatFiles = (chatIds: URI[]) => {
  const chatContainers = useMemo(
    () => chatIds.map(id => getContainer(id)),
    [chatIds],
  )
  const chatDocumentResults = useSolidDocuments(chatContainers)
  const chatDocuments = useResults(chatDocumentResults)
  const years = useParse(chatContainers, chatDocuments, getContains)

  const yearIds = useMemo(() => years.flatMap(year => year.contains), [years])
  const yearDocResults = useSolidDocuments(yearIds)
  const yearDocs = useResults(yearDocResults)
  const months = useParse(yearIds, yearDocs, getContains)

  const monthIds = useMemo(
    () => months.flatMap(month => month.contains),
    [months],
  )
  const monthDocResults = useSolidDocuments(monthIds)
  const monthDocs = useResults(monthDocResults)
  const days = useParse(monthIds, monthDocs, getContains)

  const dayIds = useMemo(() => days.flatMap(day => day.contains), [days])
  const dayDocResults = useSolidDocuments(dayIds)
  const dayDocs = useResults(dayDocResults)
  const chatMsgFilesInfo = useParse(dayIds, dayDocs, getContains)

  const chatMsgFiles: { [chat: URI]: URI[] } = useMemo(() => {
    const chatMessages = chatIds.map(chatId => {
      // first get years of this chat
      const chatYears = years.filter(y => y.id === getContainer(chatId))
      const chatMonths = months.filter(m =>
        chatYears.flatMap(y => y.contains).includes(m.id),
      )
      const chatDays = days.filter(d =>
        chatMonths.flatMap(m => m.contains).includes(d.id),
      )
      const chatMsgs = chatMsgFilesInfo
        .filter(i => chatDays.flatMap(d => d.contains).includes(i.id))
        .flatMap(i => i.contains)

      return [chatId, chatMsgs]
    })

    return Object.fromEntries(chatMessages)
  }, [chatIds, chatMsgFilesInfo, days, months, years])

  return { data: chatMsgFiles }
}
