import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// eslint-disable-next-line import/no-default-export
export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
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
)
