import { defineConfig } from '@lingui/cli'
import { defaultLocale, locales } from './src/config/locales'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  sourceLocale: 'en',
  locales,
  fallbackLocales: { default: defaultLocale },
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['src'],
    },
  ],
  compileNamespace: 'ts',
})
