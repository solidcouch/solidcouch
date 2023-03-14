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
