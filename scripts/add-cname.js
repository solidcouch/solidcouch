#!/usr/bin/env node

const fs = require('fs')

// write CNAME into ./build based on BASE_URL environment variable
// this is meant for deployment to github pages

const baseUrl = process.env.BASE_URL

if (!baseUrl) throw new Error('Missing BASE_URL in environment variables!')

const { hostname } = new URL(baseUrl)

// Write the content to the output file
fs.writeFileSync('./build/CNAME', hostname, 'utf8')

// eslint-disable-next-line no-console
console.log('CNAME generated successfully.')
