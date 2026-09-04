import pluginNext from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...tseslint.configs.recommended,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      '.worktrees/**',
      'out/**',
      'coverage/**',
      'public/static/**',
    ],
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

      // ─── Specdrivr Architectural Guards ─────────────────────────────────────
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-debugger': 'error',
      'no-console': ['warn', { allow: ['info', 'error', 'warn'] }], // Prefer Pino logger

      // Prevent direct process.env access (Use @/lib/env)
      'no-restricted-properties': [
        'warn',
        {
          object: 'process',
          property: 'env',
          message: 'Use Zod-validated env from "@/lib/env" instead of process.env.',
        },
      ],

      // Boundary Preservation: No DB imports in components/pages
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '@/db',
              message: 'Direct DB access in components is prohibited. Use Repositories instead.',
              allowTypeImports: true,
            },
            {
              name: '@/db/schema',
              message: 'Direct DB access in components is prohibited. Use Repositories instead.',
              allowTypeImports: true,
            },
          ],
          patterns: [
            {
              group: ['@/db/*'],
              message: 'Direct DB access in components is prohibited. Use Repositories instead.',
              allowTypeImports: true,
            },
          ],
        },
      ],

      // Enforce Repository Wrapper
      'no-restricted-syntax': [
        'warn',
        // Guard: Repositories must use executeQuery
        {
          selector:
            "ImportDeclaration[source.value='@/repositories'] ~ FunctionDeclaration:not(:has(CallExpression[callee.name='executeQuery']))",
          message: "All repository methods must be wrapped in 'executeQuery'.",
        },
        // Guard: No raw HTML primitives for common components
        {
          selector: 'JSXOpeningElement[name.name=/^(button|input|select)$/]',
          message:
            'Prefer the design system components in @/components/ui (Button, Input, Select) over raw HTML primitives.',
        },
      ],
    },
  },
  // Architectural rule exceptions
  {
    files: [
      'src/repositories/**/*',
      'src/queries/**/*',
      'src/db/**/*',
      'src/lib/auth.ts',
      'src/app/api/**/*',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
  {
    files: [
      'drizzle.config.ts',
      'playwright.config.ts',
      'src/lib/env-core.ts',
      'src/proxy.ts',
      'src/lib/auth-client.ts',
      'src/lib/logger-client.ts',
      'src/app/error.tsx',
      'src/app/global-error.tsx',
      'src/app/(auth)/login/page.tsx',
    ],
    rules: {
      'no-restricted-properties': 'off',
    },
  },
  {
    files: [
      'src/components/ui/input.tsx',
      'src/components/ui/button.tsx',
      'src/components/ui/select.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  // Exclusions for tests and scripts where architectural rules are too strict
  {
    files: ['tests/**/*', 'scripts/**/*', 'next.config.js', 'eslint.config.js'],
    rules: {
      'no-console': 'off',
      'no-restricted-properties': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
];

export default eslintConfig;
