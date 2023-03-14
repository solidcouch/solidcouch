export type URI = string

export type Location = {
  lat: number
  long: number
}

export interface Accommodation {
  id: URI
  description: string
  location: Location
}

// WIP types

export type Person = {
  id: URI
}

export type Community = {
  id: URI
  group: URI
  name: string
  description: string
}
