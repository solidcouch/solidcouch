import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
;(() => {
  const communityName = process.env.VITE_COMMUNITY_NAME_UNSAFE

  if (!communityName) return

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  // Path to the built manifest.json in the build directory
  const manifestPath = path.join(__dirname, '..', 'build', 'manifest.json')

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  // Update the manifest
  manifest.name = communityName
  manifest.short_name = communityName

  // Write the updated manifest back to the build directory
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  // eslint-disable-next-line no-console
  console.log('manifest.json has been updated in the build directory.')
})()
