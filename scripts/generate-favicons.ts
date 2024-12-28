import { FaviconOptions, favicons } from 'favicons'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { HttpError } from '../src/utils/errors'

export const generateFavicons = async ({ logo }: { logo: string }) => {
  const source = await fetchImage(logo)

  const options: FaviconOptions = {
    icons: {
      favicons: true,
      android: true,
      appleIcon: false,
      appleStartup: false,
      windows: false,
      yandex: false,
    },
  }
  const results = await favicons(source, options)

  const favicon = results.images.find(image => image.name === 'favicon.ico')
  const android192 = results.images.find(
    image => image.name === 'android-chrome-192x192.png',
  )
  const android512 = results.images.find(
    image => image.name === 'android-chrome-512x512.png',
  )

  if (favicon)
    await writeFile(path.join('./dist', 'favicon.ico'), favicon.contents)

  if (android192)
    await writeFile(path.join('./dist', 'logo192.png'), android192.contents)

  if (android512)
    await writeFile(path.join('./dist', 'logo512.png'), android512.contents)
}

async function fetchImage(url: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new HttpError(`Failed to fetch image`, response)
  }

  // Convert the response body to a buffer
  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer)
}
