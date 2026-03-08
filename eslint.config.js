import pluginNext from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...tseslint.configs.recommended,
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    plugins: {
      '@next/next': pluginNext,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
];

export default eslintConfig;
