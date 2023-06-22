import { fetch } from '@inrupt/solid-client-authn-browser'
import { URI } from 'types'

export const fetchWithRedirect: typeof fetch = async (url, init) => {
  // first try to find final redirect
  const response = await globalThis.fetch(url, { method: 'GET' })
  // then fetch from this final redirect
  // hopefully a cors-compatible solid pod
  return await fetch(response.url, init)
}

export const file2base64 = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = e => reject(e)
  })

export const getContainer = (uri: URI): URI => {
  const url = new URL(uri)
  url.hash = ''
  url.search = ''
  if (url.pathname.length === 0 || url.pathname === '/') return url.toString()
  const pathPieces = url.pathname.split('/').slice(0, -1)
  pathPieces.push('')
  url.pathname = pathPieces.join('/')

  return url.toString()
}

/**
 * Get container which is a parent container of current resource or container
 */
export const getParent = (uri: URI): URI => {
  const container = getContainer(uri)
  return container === uri ? getParentContainer(container) : container
}

export const getAllParents = (uri: URI) => generateIteratively(uri, getParent)

/**
 * Return parent container of a container
 *
 * @example
 * https://example.com/asdf/ghjk/ -> https://example.com/asdf/
 * https://example.com/asdf/ -> https://example.com/
 * https://example.com/ -> https://example.com/
 *
 */
export const getParentContainer = (uri: URI): URI => {
  const url = new URL(uri)
  if (url.pathname.length === 0 || url.pathname === '/') return uri
  const pathPieces = url.pathname.split('/').slice(0, -2)
  pathPieces.push('')
  url.pathname = pathPieces.join('/')

  return url.toString()
}

export const fullFetch: typeof fetch = async (url, init) => {
  try {
    return await fetch(url, init)
  } catch (error) {
    return await fetchWithRedirect(url, init)
  }
}

export const removeHashFromURI = (uri: URI): URI => {
  const url = new URL(uri)
  url.hash = ''
  return url.toString()
}

/**
 * Convert (http) uri to uri with https://
 */
export const https = (uri: URI): URI => {
  const url = new URL(uri)
  url.protocol = 'https'
  return url.toString()
}

/**
 * Find repeated values in a sequence generated based on a starting value and a generator function.
 * List of results doesn't include the starting value
 *
 * @template T - The type of values in the sequence.
 * @param {T} initialValue - The initial value to start the sequence.
 * @param {(prevValue: T) => T} generateNextValue - A function that generates the next value based on the previous value.
 * @returns {T[]} - An array containing the found values until the first repeated value.
 */
export const generateIteratively = <T>(
  initialValue: T,
  generateNextValue: (prevValue: T) => T,
): T[] => {
  const seen = new Set<T>()
  let value: T = initialValue

  while (!seen.has(value)) {
    seen.add(value)
    value = generateNextValue(value)
  }

  seen.delete(initialValue)
  return Array.from(seen)
}
