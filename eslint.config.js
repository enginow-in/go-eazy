import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import security from 'eslint-plugin-security'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      security.configs.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // ESLint core
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
          // Intentional: index.html filters console in production
          // This rule prevents accidental debug logs from shipping
        },
      ],

      // Security plugin: catch RLS policy vulnerabilities in Supabase calls
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'off',
      // Rationale: Dynamic regexes are necessary for search filters
      // Supabase Edge Functions validate all user input server-side

      // Accessibility: ensure components are keyboard-navigable & screen-reader friendly
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/img-redundant-alt': 'error',
      // Rationale: GoEazy protects images from copying (index.css)
      // But alt text is still required for accessibility

      // React best practices
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
])
