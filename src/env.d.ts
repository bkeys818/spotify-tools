/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly PUBLIC_ORIGIN: string
	readonly PUBLIC_CLIENT_ID: string
	readonly CLIENT_SECRET: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
