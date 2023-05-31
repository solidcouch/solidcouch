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
  const fragments = uri.split('/')
  fragments[fragments.length - 1] = ''
  return fragments.join('/')
}

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
