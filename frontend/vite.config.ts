import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [react(), tailwindcss()],
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
		host: '127.0.0.1', // Only DEV host allowed by Spotify
		port: 5050
	}
})
