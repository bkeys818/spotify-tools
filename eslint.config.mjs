import js from '@eslint/js'
import ts from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import svelteConfig from './frontend/svelte.config.js'

export default defineConfig([
	globalIgnores([
		// Configs
		'**/jest.config.*js',
		'**/eslint.config.*js',
		'**/postcss.config.*js',
		'**/tailwind.config.*js',
		//  SvelteKit
		'frontend/build',
		'frontend/.svelte-kit',
		'frontend/package',
		'**/svelte.config.*js',
		'**/vite.config.*js',
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
	...svelte.configs.recommended,
	{
		files: ['frontend/**'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte', '.svelte.ts'],
				parser: ts.parser,
				svelteFeatures: {
					experimentalGenerics: true
				},
				svelteConfig
			},
			globals: globals.browser
		},
		rules: {
			'@typescript-eslint/only-throw-error': 'off',
			'svelte/no-navigation-without-resolve': 'off',
			'@typescript-eslint/no-misused-promises': ['error', { checksConditionals: false }],
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off'
		}
	},
	eslintConfigPrettier
])
