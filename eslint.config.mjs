import js from '@eslint/js';
import ts from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte';
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfig([
	globalIgnores([
		// Configs
		"**/jest.config.*js",
		"**/eslint.config.*js",
		"**/postcss.config.*js",
		//  SvelteKit
		"frontend/build",
		"frontend/.svelte-kit",
		"frontend/package",
		"**/svelte.config.*js",
		"**/vite.config.*js",
		// Firebase
		"functions/lib/"
	]),
	js.configs.recommended,
	...ts.configs.recommendedTypeChecked,
	{
		files: ["functions/**"],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
			globals: globals.node
		}
	},
  	...svelte.configs.recommended,
	{
		files: ["frontend/**"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'], // Add support for additional file extensions, such as .svelte
				parser: ts.parser,
			},
			globals: globals.browser,
		},
	},
	eslintConfigPrettier
])
