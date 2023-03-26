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
  from: Person
  to: Person
}

export type Thread = {
  userId: Person // the other person
  messages: Message[] // last one or more messages
}
