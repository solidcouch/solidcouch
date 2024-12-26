// a simple vite config for cypress
import { defineConfig } from 'vite'

// eslint-disable-next-line import/no-default-export
export default defineConfig({ define: { 'process.env': process.env } })
