export type URI = string

export type Location = {
  lat: number
  long: number
}

export interface Accommodation {
  id: URI
  description: string
  location: Location
  offeredBy: URI
}

export type Community = {
  id: URI
  group: URI
  name: string
  description: string
}

// WIP types
export type Person = {
  id: URI
  photo?: URI
  name: string
  about?: string
}

export type Message = {
  id: URI
  message: string
  createdAt: number // timestamp
  from: URI
  status?: 'unread'
  notification?: URI
}

export type Thread = {
  id: URI
  participants: URI[] //
  messages: Message[] // last one or more messages
  status?: 'unread' | 'new'
}

export type Contact =
  | { webId: URI; status: 'confirmed' | 'request_sent' }
  | ContactInvitation

export type ContactInvitation = {
  webId: URI
  status: 'request_received'
  invitation: string // only valid for request_received
  notification: URI
}

export type Interest = {
  id: URI
  label: string
  description: string
  aliases: string[]
  image?: URI
  officialWebsite?: URI
}
