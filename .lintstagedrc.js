// eslint-disable-next-line import/no-default-export
export default {
  '*': [
    'yarn i18n:extract',
    'yarn i18n:compile',
    'prettier --write --ignore-unknown',
    () => 'knip',
  ],
  '*.{js,jsx,ts,tsx}': 'eslint --max-warnings 0',
}
