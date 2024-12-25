import { URI } from '@/types/index.ts'
import { fetch } from '@inrupt/solid-client-authn-browser'
import * as n3 from 'n3'
import parseLinkHeader from 'parse-link-header'
import { acl, rdf } from 'rdf-namespaces'

const fetchWithRedirect: typeof fetch = async (url, init) => {
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
  } catch {
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
const generateIteratively = <T>(
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

/**
 * Find link to ACL document for a given URI
 */
export const getAcl = async (uri: URI) => {
  const response = await fetch(uri, { method: 'HEAD' })
  const linkHeader = response.headers.get('link')
  const links = parseLinkHeader(linkHeader)
  const aclUri = links?.acl?.url
  if (!aclUri) throw new Error(`We could not find WAC link for ${uri}`)
  // if aclUri is relative, return absolute uri
  return new URL(aclUri, uri).toString()
}

export const processAcl = (
  url: string,
  content: string,
): {
  url: string
  accesses: ('Read' | 'Write' | 'Append' | 'Control')[]
  agents: string[]
  agentClasses: string[]
  agentGroups: string[]
  defaults: string[]
}[] => {
  const parser = new n3.Parser({ baseIRI: url })
  const quads = parser.parse(content)
  const store = new n3.Store(quads)
  const auths = store.getSubjects(rdf.type, acl.Authorization, null)

  const accessDict = {
    [acl.Read]: 'Read',
    [acl.Write]: 'Write',
    [acl.Append]: 'Append',
    [acl.Control]: 'Control',
  } as const

  return auths.map(auth => {
    const accesses = store
      .getObjects(auth, acl.mode, null)
      .map(mode => accessDict[mode.value])

    const agents = store.getObjects(auth, acl.agent, null).map(q => q.value)
    const agentClasses = store
      .getObjects(auth, acl.agentClass, null)
      .map(q => q.value)
    const agentGroups = store
      .getObjects(auth, acl.agentGroup, null)
      .map(q => q.value)

    const defaults = store
      .getObjects(auth, acl.default__workaround, null)
      .map(a => a.value)
    return {
      url: auth.value,
      accesses,
      agents,
      agentClasses,
      agentGroups,
      defaults,
    }
  })
}

/**
 * Merge arrays of objects and deduplicate the elements by a given key
 * Note: the later array's object will overwrite previous matching ones
 */
export const mergeArrays = <
  T extends { [key in K]: string | number } & Record<string, unknown>,
  K extends keyof T,
>(
  key: K,
  ...arrays: T[][]
) => {
  const dict: { [key: string]: T } = {}

  for (const arr of arrays) {
    for (const item of arr) {
      dict[item[key]] = item
    }
  }

  return Object.values(dict)
}
