import { Message, Thread, URI } from 'types'

export const readThreads = async (): Promise<Thread[]> => {
  return []
}

export const readMessages = async ({
  userId,
}: {
  userId: URI
}): Promise<Message[]> => {
  return []
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
