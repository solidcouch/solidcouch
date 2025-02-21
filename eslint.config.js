import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import pluginLingui from 'eslint-plugin-lingui'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// eslint-disable-next-line import/no-default-export
export default tseslint.config(
  { ignores: ['dist', 'src/locales'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      pluginLingui.configs['flat/recommended'],
      eslintConfigPrettier,
    ],
    files: ['**/*.{ts,tsx,js,mts}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { args: 'after-used', ignoreRestSiblings: false },
      ],
      'import/no-default-export': 'error',
      'import/no-unused-modules': ['warn'],
    },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/router.tsx'],
    rules: {
      'lingui/no-unlocalized-strings': [
        'warn',
        {
          ignoreNames: [
            'type',
            'name',
            'required',
            'to',
            'scrollWheelZoom',
            'doubleClickZoom',
            'touchZoom',
            'data-cy',
            'id',
            'target',
            'rel',
            'className',
            'clickBehavior',
            'style',
          ],
          ignoreFunctions: [
            'register',
            'omit',
            'checks.push',
            '*.startsWith',
            '*.addEventListener',
            '*.removeEventListener',
            'useMapEvent',
            'clsx',
            'URL',
            '*.getElementById',
            'setValue',
            'watch',
            'searchParams.get',
          ],
        },
      ],
    },
  },
)
