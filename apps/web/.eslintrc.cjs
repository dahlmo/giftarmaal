module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['svelte', '@typescript-eslint', 'simple-import-sort'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier'
  ],
  overrides: [{
    files: ['**/*.svelte'],
    parser: 'svelte-eslint-parser',
    parserOptions: { parser: '@typescript-eslint/parser' }
  }],
  rules: { 'simple-import-sort/imports': 'warn', 'simple-import-sort/exports': 'warn' }
};
