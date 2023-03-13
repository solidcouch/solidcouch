export type URI = string

export interface Accommodation {
  id: URI
  description: string
  location: { latitude: number; longitude: number }
}
