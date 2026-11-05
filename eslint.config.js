// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    // Zod schemas intentionally share their names with the exported inferred types.
    rules: {
      '@typescript-eslint/no-redeclare': 'off',
    },
  },
]);
