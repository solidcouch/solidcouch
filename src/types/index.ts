import { ContactStatus } from '@/hooks/data/useContacts'
import { Overwrite } from 'utility-types'

export type URI = string

export type Location = {
  lat: number
  long: number
}

export type Bounds = { n: number; s: number; e: number; w: number }

export interface Accommodation {
  id: URI
  description: string
  location: Location
  offeredBy: URI
}

export type AccommodationExtended = Overwrite<
  Accommodation,
  { offeredBy: Person }
>

// export type Community = {
//   id: URI
//   group: URI
//   name: string
//   description: string
// }

// WIP types
export type Person = {
  id: URI
  photo?: URI
  name: string
  about?: string
  interests?: URI[]
}

export type Message = {
  id: URI
  message: string
  createdAt: number // timestamp
  from: URI
  status?: 'unread'
  notification?: URI
  chat: URI
  otherChats?: URI[]
}

export type Thread = {
  id: URI
  related: URI[]
  participants: URI[] //
  messages: Message[] // last one or more messages
  status?: 'unread' | 'new'
}

export type Contact =
  | { webId: URI; status: ContactStatus.confirmed | ContactStatus.requestSent }
  | ContactInvitation

export type ContactInvitation = {
  webId: URI
  status: ContactStatus.requestReceived
  invitation: string // only valid for request_received
  notification: URI
}

export type Interest = {
  id?: string
  uri: URI
  label?: string
  description?: string
  aliases: string[]
  image?: URI
  officialWebsite?: URI
}
