import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
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
      'no-unused-vars': ['error', {
        // Uppercase-prefixed vars (React components, constants) and the
        // framer-motion `motion` namespace are exempt — ESLint does not
        // track JSX namespace usage (<motion.div>) as a variable reference.
        varsIgnorePattern: '^[A-Z_]|^motion$',
        // Catch clause bindings and function args prefixed with _ are
        // intentionally unused (e.g. `catch (_err)` for optimistic rollback).
        caughtErrorsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],
    },
  },
])
