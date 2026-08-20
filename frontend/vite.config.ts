import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [react(), tailwindcss()],
	// Matches SvelteKit's `$env/static/public` convention so .env files and the
	// `envkey_PUBLIC_CLIENT_ID` step in frontend-build.yml keep working unchanged.
	envPrefix: 'PUBLIC_',
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	// `build` (not vite's default `dist`) so firebase.json and the CI artifact
	// paths keep pointing at the right directory.
	build: {
		outDir: 'build'
	},
	server: {
		port: 5050,
		host: true
	}
})
