import fs from 'fs'

// this is meant for deployment to github pages

export const addCname = ({ baseUrl }: { baseUrl: string }) => {
  const { hostname } = new URL(baseUrl)

  // Write the content to the output file
  fs.writeFileSync('./dist/CNAME', hostname, 'utf8')
}
