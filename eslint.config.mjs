import js from '@eslint/js'
import ts from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfig([
	globalIgnores([
		// Configs
		'**/jest.config.*js',
		'**/eslint.config.*js',
		'**/postcss.config.*js',
		'**/tailwind.config.*js',
		'**/vite.config.*js',
		// Frontend
		'frontend/build',
		// Firebase
		'functions/lib/'
	]),
	js.configs.recommended,
	...ts.configs.recommendedTypeChecked,
	{
		files: ['functions/**'],
		languageOptions: {
			parserOptions: {
				projectService: true
			},
			globals: globals.node
		}
	},
	{
		files: ['frontend/**/*.{ts,tsx}'],
		extends: [react.configs.flat.recommended, react.configs.flat['jsx-runtime']],
		plugins: {
			'react-hooks': reactHooks
		},
		languageOptions: {
			parserOptions: {
				projectService: true,
				parser: ts.parser,
				ecmaFeatures: { jsx: true }
			},
			globals: globals.browser
		},
		settings: {
			react: { version: 'detect' }
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			'@typescript-eslint/only-throw-error': 'off',
			'@typescript-eslint/no-misused-promises': ['error', { checksConditionals: false }],
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off'
		}
	},
	eslintConfigPrettier
])
